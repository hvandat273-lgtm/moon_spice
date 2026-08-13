import { NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const databaseMock = vi.hoisted(() => vi.fn());

vi.mock("@/db/client", () => ({
  getDatabase: databaseMock,
  hasDatabaseUrl: () => Boolean(process.env.DATABASE_URL),
}));

import {
  adminSessionCookieName,
  clearAdminSessionCookie,
  readAdminSession,
  requireAdminSession,
  setAdminSessionCookie,
} from "@/lib/server/auth";

const rawToken = "test-session-token-with-at-least-thirty-two-characters";
const now = new Date("2026-08-10T04:00:00.000Z");

interface SessionRow {
  sessionId: string;
  expiresAt: Date;
  lastUsedAt: Date;
  sessionCreatedAt: Date;
  id: string;
  email: string;
  displayName: string;
  role: "OWNER" | "ADMIN";
  passwordChangedAt: Date;
  active?: boolean;
  revokedAt?: Date | null;
}

function installSessionDatabase(row: SessionRow | null) {
  const touched: Array<Record<string, unknown>> = [];
  const selected = row
    && row.expiresAt > now
    && row.lastUsedAt > new Date(now.getTime() - 2 * 60 * 60 * 1000)
    && row.active !== false
    && !row.revokedAt
      ? [row]
      : [];
  const selectChain = {
    from() { return selectChain; },
    innerJoin() { return selectChain; },
    where() { return selectChain; },
    async limit() { return selected; },
  };
  const database = {
    select: vi.fn(() => selectChain),
    update: vi.fn(() => ({
      set(values: Record<string, unknown>) {
        touched.push(values);
        return { async where() { return []; } };
      },
    })),
  };
  databaseMock.mockReturnValue(database);
  return { touched, database };
}

function requestWithSession(token = rawToken): Request {
  return new Request("http://localhost:3000/api/admin/session", {
    headers: { cookie: `${adminSessionCookieName()}=${token}` },
  });
}

function activeRow(overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    sessionId: "00000000-0000-4000-8000-000000000801",
    expiresAt: new Date("2026-08-10T12:00:00.000Z"),
    lastUsedAt: new Date("2026-08-10T03:50:00.000Z"),
    sessionCreatedAt: new Date("2026-08-10T00:00:00.000Z"),
    id: "00000000-0000-4000-8000-000000000802",
    email: "owner@moonspice.example",
    displayName: "Moon Spice Owner",
    role: "OWNER",
    passwordChangedAt: new Date("2026-08-09T00:00:00.000Z"),
    active: true,
    revokedAt: null,
    ...overrides,
  };
}

describe("admin session lifecycle", () => {
  beforeEach(() => {
    databaseMock.mockReset();
    process.env.CATALOG_BACKEND = "postgres";
    process.env.DATABASE_URL = "postgresql://test.invalid/moor_spice";
    process.env.SESSION_SECRET = "test-session-secret-with-more-than-thirty-two-bytes";
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    delete process.env.SESSION_SECRET;
    delete process.env.CATALOG_BACKEND;
    delete process.env.DATABASE_URL;
  });

  it("rejects missing or malformed raw tokens before querying the database", async () => {
    expect(await readAdminSession(new Request("http://localhost:3000/api/admin/session"))).toBeNull();
    expect(await readAdminSession(requestWithSession("too-short"))).toBeNull();
    expect(databaseMock).not.toHaveBeenCalled();
  });

  it("rejects absolute-expired, idle-expired and revoked sessions", async () => {
    installSessionDatabase(activeRow({ expiresAt: new Date("2026-08-10T03:59:59.999Z") }));
    expect(await readAdminSession(requestWithSession())).toBeNull();

    installSessionDatabase(activeRow({ lastUsedAt: new Date("2026-08-10T01:59:59.999Z") }));
    expect(await readAdminSession(requestWithSession())).toBeNull();

    installSessionDatabase(activeRow({ revokedAt: new Date("2026-08-10T03:00:00.000Z") }));
    expect(await readAdminSession(requestWithSession())).toBeNull();
  });

  it("invalidates sessions created before a password change", async () => {
    installSessionDatabase(activeRow({
      sessionCreatedAt: new Date("2026-08-10T00:00:00.000Z"),
      passwordChangedAt: new Date("2026-08-10T00:00:00.001Z"),
    }));

    expect(await readAdminSession(requestWithSession())).toBeNull();
    await expect(requireAdminSession(requestWithSession())).rejects.toMatchObject({ status: 401, code: "UNAUTHORIZED" });
  });

  it("returns active identity and refreshes last-used time only after the touch interval", async () => {
    const stale = installSessionDatabase(activeRow({ lastUsedAt: new Date("2026-08-10T03:50:00.000Z") }));
    await expect(readAdminSession(requestWithSession())).resolves.toMatchObject({
      id: "00000000-0000-4000-8000-000000000802",
      sessionId: "00000000-0000-4000-8000-000000000801",
      role: "OWNER",
    });
    expect(stale.touched).toEqual([{ lastUsedAt: now }]);

    const recent = installSessionDatabase(activeRow({ lastUsedAt: new Date("2026-08-10T03:57:00.000Z") }));
    await expect(readAdminSession(requestWithSession())).resolves.not.toBeNull();
    expect(recent.touched).toHaveLength(0);
  });

  it("sets and clears hardened host-only cookies", () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = NextResponse.json({ ok: true });
    setAdminSessionCookie(response, rawToken, new Date("2026-08-10T12:00:00.000Z"));
    const issued = response.headers.get("set-cookie") ?? "";

    expect(issued).toContain("__Host-moon_spice_admin=");
    expect(issued).toContain("HttpOnly");
    expect(issued).toContain("Secure");
    expect(issued).toContain("SameSite=strict");
    expect(issued).toContain("Path=/");
    expect(issued).not.toContain("Domain=");

    const cleared = NextResponse.json({ ok: true });
    clearAdminSessionCookie(cleared);
    expect(cleared.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
