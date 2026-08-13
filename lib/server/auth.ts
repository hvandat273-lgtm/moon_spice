import { randomBytes } from "node:crypto";

import { compare } from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { z } from "zod";

import { getDatabase, hasDatabaseUrl } from "@/db/client";
import { admins, adminSessions, auditLogs } from "@/db/schema";

import { hmacSha256, safeHexEqual, sha256 } from "./crypto";
import {
  assertProductionDatabaseIdentity,
  assertProductionEnvironment,
  getCatalogBackend,
  requireSecret,
  usesPostgresCatalogBackend,
} from "./env";
import { AppError } from "./errors";
import { enforceAllRateLimits } from "./rate-limit";

const DATABASE_ABSOLUTE_TIMEOUT_MS = 12 * 60 * 60 * 1000;
const DATABASE_IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000;
const STATELESS_TIMEOUT_SECONDS = 2 * 60 * 60;
const DUMMY_PASSWORD_HASH = "$2b$12$oWSzWrOtncUZ9tYEb7AYYOP38s5WXjaXBloSSGOEZlW8CLcfoS5/K";
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$(1[2-4])\$[./A-Za-z0-9]{53}$/;

const statelessClaimsSchema = z.object({
  typ: z.literal("moor-spice-admin"),
  ver: z.literal(1),
  sub: z.literal("environment-admin"),
  email: z.string().email().max(254),
  displayName: z.string().min(1).max(80),
  role: z.literal("OWNER"),
  sessionVersion: z.string().regex(/^[A-Za-z0-9._:-]{1,64}$/),
  configurationHash: z.string().regex(/^[a-f0-9]{64}$/),
  jti: z.string().regex(/^[A-Za-z0-9_-]{20,64}$/),
  iat: z.number().int().nonnegative(),
  exp: z.number().int().positive(),
}).strict();

type StatelessClaims = z.infer<typeof statelessClaimsSchema>;

interface EnvironmentAdminConfiguration {
  email: string;
  passwordHash: string;
  displayName: string;
  sessionVersion: string;
}

export interface AdminIdentity {
  id: string;
  email: string;
  displayName: string;
  role: "OWNER" | "ADMIN";
}

export interface AdminSessionIdentity extends AdminIdentity {
  sessionId: string;
  expiresAt: Date;
}

export interface AdminLoginResult {
  admin: AdminIdentity;
  token: string;
  expiresAt: Date;
}

export function adminSessionCookieName(): string {
  return process.env.NODE_ENV === "production" ? "__Host-moon_spice_admin" : "moon_spice_admin";
}

function usesDatabaseSessions(): boolean {
  return usesPostgresCatalogBackend() && hasDatabaseUrl();
}

function databaseSessionTokenHash(rawToken: string): string {
  return hmacSha256(requireSecret("SESSION_SECRET"), `moor-spice/admin-database-session/v1\0${rawToken}`);
}

function readRawCookie(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === adminSessionCookieName()) return value.join("=");
  }
  return null;
}

async function resolveRawToken(source?: Request | string | null): Promise<string | null> {
  if (source instanceof Request) return readRawCookie(source.headers.get("cookie"));
  if (typeof source === "string") return readRawCookie(source);
  const store = await cookies();
  return store.get(adminSessionCookieName())?.value ?? null;
}

function validatePasswordInput(password: string): void {
  const length = Buffer.byteLength(password, "utf8");
  if (length < 12 || length > 72) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng");
  }
}

function readEnvironmentAdminConfiguration(): EnvironmentAdminConfiguration {
  const emailResult = z.string().trim().toLowerCase().email().max(254).safeParse(process.env.ADMIN_EMAIL);
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim() ?? "";
  const displayNameResult = z.string().trim().min(1).max(80).safeParse(process.env.ADMIN_DISPLAY_NAME?.trim() || "Quản trị viên");
  const sessionVersionResult = z.string().trim().regex(/^[A-Za-z0-9._:-]{1,64}$/).safeParse(process.env.ADMIN_SESSION_VERSION);

  if (!emailResult.success || !BCRYPT_HASH_PATTERN.test(passwordHash) || !displayNameResult.success || !sessionVersionResult.success) {
    throw new AppError(
      503,
      "ADMIN_AUTH_NOT_CONFIGURED",
      "Đăng nhập quản trị chưa được cấu hình. Hãy kiểm tra ADMIN_EMAIL, ADMIN_PASSWORD_HASH và ADMIN_SESSION_VERSION.",
    );
  }
  try {
    requireSecret("SESSION_SECRET");
  } catch {
    throw new AppError(503, "ADMIN_AUTH_NOT_CONFIGURED", "Đăng nhập quản trị chưa được cấu hình. SESSION_SECRET phải có ít nhất 32 byte.");
  }
  return {
    email: emailResult.data,
    passwordHash,
    displayName: displayNameResult.data,
    sessionVersion: sessionVersionResult.data,
  };
}

export function getAdminAuthenticationConfigurationIssue(): string | null {
  let backend: ReturnType<typeof getCatalogBackend>;
  try {
    backend = getCatalogBackend();
  } catch {
    return "CATALOG_BACKEND không hợp lệ. Hãy dùng local-json, vercel-blob hoặc postgres.";
  }
  if (!backend) return "Chưa cấu hình nguồn dữ liệu. Hãy đặt CATALOG_BACKEND trước khi đăng nhập quản trị.";
  if (backend === "postgres") {
    return hasDatabaseUrl() ? null : "CATALOG_BACKEND=postgres cần DATABASE_URL.";
  }
  if (backend === "vercel-blob" && !process.env.CATALOG_BLOB_READ_WRITE_TOKEN?.trim()) {
    return "CATALOG_BACKEND=vercel-blob cần CATALOG_BLOB_READ_WRITE_TOKEN của kho JSON private.";
  }
  try {
    readEnvironmentAdminConfiguration();
    return null;
  } catch (error) {
    return error instanceof AppError ? error.message : "Đăng nhập quản trị chưa được cấu hình.";
  }
}

export function assertAdminAuthenticationConfigured(): void {
  const issue = getAdminAuthenticationConfigurationIssue();
  if (issue) throw new AppError(503, "ADMIN_AUTH_NOT_CONFIGURED", issue);
}

function statelessConfigurationHash(configuration: EnvironmentAdminConfiguration): string {
  const secret = requireSecret("SESSION_SECRET");
  return hmacSha256(
    secret,
    `moor-spice/admin-environment-binding/v1\0${configuration.email}\0${configuration.passwordHash}\0${configuration.displayName}\0${configuration.sessionVersion}`,
  );
}

function signStatelessClaims(claims: StatelessClaims): string {
  const encoded = Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
  const signature = hmacSha256(requireSecret("SESSION_SECRET"), `moor-spice/admin-stateless-session/v1\0${encoded}`);
  return `${encoded}.${signature}`;
}

function verifyStatelessToken(rawToken: string): AdminSessionIdentity | null {
  if (rawToken.length < 128 || rawToken.length > 2048) return null;
  const [encoded, signature, extra] = rawToken.split(".");
  if (!encoded || !signature || extra !== undefined || !/^[A-Za-z0-9_-]+$/.test(encoded)) return null;

  let secret: string;
  let configuration: EnvironmentAdminConfiguration;
  try {
    secret = requireSecret("SESSION_SECRET");
    configuration = readEnvironmentAdminConfiguration();
  } catch {
    return null;
  }
  const expectedSignature = hmacSha256(secret, `moor-spice/admin-stateless-session/v1\0${encoded}`);
  if (!safeHexEqual(signature, expectedSignature)) return null;

  let parsed: unknown;
  try {
    const decoded = Buffer.from(encoded, "base64url");
    if (decoded.toString("base64url") !== encoded) return null;
    parsed = JSON.parse(decoded.toString("utf8")) as unknown;
  } catch {
    return null;
  }
  const result = statelessClaimsSchema.safeParse(parsed);
  if (!result.success) return null;

  const claims = result.data;
  const now = Math.floor(Date.now() / 1000);
  if (
    claims.exp - claims.iat !== STATELESS_TIMEOUT_SECONDS
    || claims.iat > now + 60
    || claims.exp <= now
    || claims.email !== configuration.email
    || claims.displayName !== configuration.displayName
    || claims.sessionVersion !== configuration.sessionVersion
    || !safeHexEqual(claims.configurationHash, statelessConfigurationHash(configuration))
  ) {
    return null;
  }
  return {
    id: `env-${sha256(configuration.email).slice(0, 24)}`,
    email: claims.email,
    displayName: claims.displayName,
    role: claims.role,
    sessionId: claims.jti,
    expiresAt: new Date(claims.exp * 1000),
  };
}

async function loginEnvironmentAdmin(input: { email: string; password: string; ip?: string }): Promise<AdminLoginResult> {
  const configuration = readEnvironmentAdminConfiguration();
  const email = input.email.trim().toLowerCase();
  validatePasswordInput(input.password);
  await enforceAllRateLimits([
    { action: "admin-login-ip", key: input.ip ?? "unknown", limit: 20, windowSeconds: 15 * 60 },
    { action: "admin-login-email", key: email, limit: 5, windowSeconds: 15 * 60 },
  ]);
  const passwordMatches = await compare(input.password, configuration.passwordHash);
  if (email !== configuration.email || !passwordMatches) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng");
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAtSeconds = issuedAt + STATELESS_TIMEOUT_SECONDS;
  const claims: StatelessClaims = {
    typ: "moor-spice-admin",
    ver: 1,
    sub: "environment-admin",
    email: configuration.email,
    displayName: configuration.displayName,
    role: "OWNER",
    sessionVersion: configuration.sessionVersion,
    configurationHash: statelessConfigurationHash(configuration),
    jti: randomBytes(18).toString("base64url"),
    iat: issuedAt,
    exp: expiresAtSeconds,
  };
  return {
    admin: {
      id: `env-${sha256(configuration.email).slice(0, 24)}`,
      email: configuration.email,
      displayName: configuration.displayName,
      role: "OWNER",
    },
    token: signStatelessClaims(claims),
    expiresAt: new Date(expiresAtSeconds * 1000),
  };
}

async function loginDatabaseAdmin(input: { email: string; password: string; ip?: string; requestId?: string }): Promise<AdminLoginResult> {
  assertProductionEnvironment();
  await assertProductionDatabaseIdentity();
  const email = input.email.trim().toLowerCase();
  validatePasswordInput(input.password);
  await enforceAllRateLimits([
    { action: "admin-login-ip", key: input.ip ?? "unknown", limit: 20, windowSeconds: 15 * 60 },
    { action: "admin-login-email", key: email, limit: 5, windowSeconds: 15 * 60 },
  ]);
  const db = getDatabase();
  const [admin] = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
  const passwordMatches = await compare(input.password, admin?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (!admin || !admin.active || !passwordMatches) {
    await db.insert(auditLogs).values({
      action: "ADMIN_LOGIN_FAILED",
      entityType: "Admin",
      entityId: admin?.id,
      requestId: input.requestId,
    });
    throw new AppError(401, "INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng");
  }
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + DATABASE_ABSOLUTE_TIMEOUT_MS);
  await db.transaction(async (tx) => {
    const [lockedAdmin] = await tx.select().from(admins).where(eq(admins.id, admin.id)).for("share").limit(1);
    if (
      !lockedAdmin?.active
      || lockedAdmin.passwordHash !== admin.passwordHash
      || lockedAdmin.passwordChangedAt.getTime() !== admin.passwordChangedAt.getTime()
    ) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng");
    }
    await tx.insert(adminSessions).values({ adminId: admin.id, tokenHash: databaseSessionTokenHash(token), expiresAt });
    await tx.insert(auditLogs).values({
      adminId: admin.id,
      action: "ADMIN_LOGIN_SUCCEEDED",
      entityType: "Admin",
      entityId: admin.id,
      requestId: input.requestId,
    });
  });
  return {
    admin: { id: admin.id, email: admin.email, displayName: admin.displayName, role: admin.role },
    token,
    expiresAt,
  };
}

export async function loginAdmin(input: { email: string; password: string; ip?: string; requestId?: string }): Promise<AdminLoginResult> {
  assertAdminAuthenticationConfigured();
  return usesDatabaseSessions() ? loginDatabaseAdmin(input) : loginEnvironmentAdmin(input);
}

export function setAdminSessionCookie(response: NextResponse, token: string, expiresAt: Date): void {
  response.cookies.set({
    name: adminSessionCookieName(),
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
}

export function clearAdminSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: adminSessionCookieName(),
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

async function readDatabaseAdminSession(token: string): Promise<AdminSessionIdentity | null> {
  if (token.length < 32 || token.length > 128) return null;
  await assertProductionDatabaseIdentity();
  let tokenHash: string;
  try {
    tokenHash = databaseSessionTokenHash(token);
  } catch {
    return null;
  }
  const now = new Date();
  const idleCutoff = new Date(now.getTime() - DATABASE_IDLE_TIMEOUT_MS);
  const [row] = await getDatabase()
    .select({
      sessionId: adminSessions.id,
      expiresAt: adminSessions.expiresAt,
      lastUsedAt: adminSessions.lastUsedAt,
      sessionCreatedAt: adminSessions.createdAt,
      id: admins.id,
      email: admins.email,
      displayName: admins.displayName,
      role: admins.role,
      passwordChangedAt: admins.passwordChangedAt,
    })
    .from(adminSessions)
    .innerJoin(admins, eq(admins.id, adminSessions.adminId))
    .where(and(
      eq(adminSessions.tokenHash, tokenHash),
      isNull(adminSessions.revokedAt),
      gt(adminSessions.expiresAt, now),
      gt(adminSessions.lastUsedAt, idleCutoff),
      eq(admins.active, true),
    ))
    .limit(1);
  if (!row || row.sessionCreatedAt < row.passwordChangedAt) return null;
  if (now.getTime() - row.lastUsedAt.getTime() > 5 * 60 * 1000) {
    await getDatabase()
      .update(adminSessions)
      .set({ lastUsedAt: now })
      .where(and(eq(adminSessions.id, row.sessionId), isNull(adminSessions.revokedAt), gt(adminSessions.expiresAt, now)));
  }
  return { id: row.id, email: row.email, displayName: row.displayName, role: row.role, sessionId: row.sessionId, expiresAt: row.expiresAt };
}

export async function readAdminSession(source?: Request | string | null): Promise<AdminSessionIdentity | null> {
  const token = await resolveRawToken(source);
  if (!token) return null;
  let backend: ReturnType<typeof getCatalogBackend>;
  try {
    backend = getCatalogBackend();
  } catch {
    return null;
  }
  if (!backend) return null;
  return usesDatabaseSessions() ? readDatabaseAdminSession(token) : verifyStatelessToken(token);
}

export async function requireAdminSession(source?: Request | string | null, roles?: readonly AdminIdentity["role"][]): Promise<AdminSessionIdentity> {
  const session = await readAdminSession(source);
  if (!session) throw new AppError(401, "UNAUTHORIZED", "Vui lòng đăng nhập quản trị");
  if (roles && !roles.includes(session.role)) throw new AppError(403, "FORBIDDEN", "Bạn không có quyền thực hiện thao tác này");
  return session;
}

export async function logoutAdminSession(source?: Request | string | null, requestId?: string): Promise<void> {
  if (!usesDatabaseSessions()) return;
  const token = await resolveRawToken(source);
  if (!token) return;
  let tokenHash: string;
  try {
    tokenHash = databaseSessionTokenHash(token);
  } catch {
    return;
  }
  const [session] = await getDatabase()
    .update(adminSessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(adminSessions.tokenHash, tokenHash), isNull(adminSessions.revokedAt)))
    .returning({ id: adminSessions.id, adminId: adminSessions.adminId });
  if (session) {
    await getDatabase().insert(auditLogs).values({
      adminId: session.adminId,
      action: "ADMIN_LOGOUT",
      entityType: "AdminSession",
      entityId: session.id,
      requestId,
    });
  }
}

export async function revokeAllAdminSessions(adminId: string, requestId?: string): Promise<number> {
  if (!usesDatabaseSessions()) return 0;
  const revoked = await getDatabase()
    .update(adminSessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(adminSessions.adminId, adminId), isNull(adminSessions.revokedAt)))
    .returning({ id: adminSessions.id });
  await getDatabase().insert(auditLogs).values({
    adminId,
    action: "ADMIN_SESSIONS_REVOKED",
    entityType: "Admin",
    entityId: adminId,
    requestId,
    metadata: { count: revoked.length },
  });
  return revoked.length;
}
