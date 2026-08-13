import { BlobPreconditionFailedError, get, put } from "@vercel/blob";
import { sql } from "drizzle-orm";

import { getDatabase, hasDatabaseUrl } from "@/db/client";

import { hmacSha256, sha256 } from "./crypto";
import { getCatalogBackend, requireSecret, usesPostgresCatalogBackend } from "./env";
import { AppError } from "./errors";

export interface RateLimitRule {
  action: string;
  key: string;
  limit: number;
  windowSeconds: number;
}

interface MemoryBucket {
  count: number;
  expiresAt: number;
}

const rateLimitState = globalThis as typeof globalThis & {
  __moorSpiceRateLimitBuckets?: Map<string, MemoryBucket>;
};

const ADMIN_LOGIN_BUCKET_PATH = "moon-spice/security/v1/admin-login-rate-limits.json";
const MAX_DURABLE_BUCKETS = 2_000;

interface DurableBucketDocument {
  version: 1;
  buckets: Record<string, MemoryBucket>;
}

function memoryBuckets(): Map<string, MemoryBucket> {
  rateLimitState.__moorSpiceRateLimitBuckets ??= new Map();
  return rateLimitState.__moorSpiceRateLimitBuckets;
}

function rateLimitKeyHash(key: string): string {
  const normalized = key.trim().toLowerCase();
  try {
    const secret = process.env.RATE_LIMIT_SECRET?.trim()
      ? requireSecret("RATE_LIMIT_SECRET")
      : requireSecret("SESSION_SECRET");
    return hmacSha256(secret, normalized);
  } catch {
    // Development can still avoid retaining raw IP/email values. Production
    // admin authentication separately requires a strong SESSION_SECRET.
    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
      return sha256(`moor-spice/development-rate-limit/v1\0${normalized}`);
    }
    throw new AppError(503, "RATE_LIMIT_UNAVAILABLE", "Không thể kiểm tra giới hạn yêu cầu");
  }
}

function enforceMemoryRateLimit(rule: RateLimitRule): void {
  const now = Date.now();
  const windowMs = rule.windowSeconds * 1000;
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const bucketKey = `${rule.action}:${windowStart}:${rateLimitKeyHash(rule.key)}`;
  const buckets = memoryBuckets();

  // A serverless instance is intentionally best effort. Bound memory and
  // discard expired windows whenever a request reaches the instance.
  for (const [key, bucket] of buckets) {
    if (bucket.expiresAt <= now) buckets.delete(key);
  }
  if (buckets.size >= 10_000 && !buckets.has(bucketKey)) {
    const oldest = buckets.keys().next().value as string | undefined;
    if (oldest) buckets.delete(oldest);
  }

  const bucket = buckets.get(bucketKey) ?? { count: 0, expiresAt: windowStart + windowMs };
  bucket.count += 1;
  buckets.set(bucketKey, bucket);
  if (bucket.count > rule.limit) {
    throw new AppError(429, "RATE_LIMITED", "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.");
  }
}

function catalogBlobToken(): string {
  const token = process.env.CATALOG_BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) throw new AppError(503, "RATE_LIMIT_UNAVAILABLE", "Không thể kiểm tra giới hạn đăng nhập");
  return token;
}

function parseDurableBuckets(value: unknown): DurableBucketDocument {
  if (!value || typeof value !== "object" || (value as { version?: unknown }).version !== 1) {
    throw new AppError(503, "RATE_LIMIT_UNAVAILABLE", "Dữ liệu giới hạn đăng nhập không hợp lệ");
  }
  const source = (value as { buckets?: unknown }).buckets;
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    throw new AppError(503, "RATE_LIMIT_UNAVAILABLE", "Dữ liệu giới hạn đăng nhập không hợp lệ");
  }
  const buckets: Record<string, MemoryBucket> = {};
  for (const [key, bucket] of Object.entries(source)) {
    if (
      key.length > 180
      || !bucket
      || typeof bucket !== "object"
      || !Number.isInteger((bucket as MemoryBucket).count)
      || (bucket as MemoryBucket).count < 0
      || !Number.isFinite((bucket as MemoryBucket).expiresAt)
    ) {
      throw new AppError(503, "RATE_LIMIT_UNAVAILABLE", "Dữ liệu giới hạn đăng nhập không hợp lệ");
    }
    buckets[key] = { count: (bucket as MemoryBucket).count, expiresAt: (bucket as MemoryBucket).expiresAt };
  }
  return { version: 1, buckets };
}

async function readDurableBuckets(token: string): Promise<{ document: DurableBucketDocument; etag: string | null }> {
  const result = await get(ADMIN_LOGIN_BUCKET_PATH, { access: "private", useCache: false, token });
  if (!result) return { document: { version: 1, buckets: {} }, etag: null };
  if (result.statusCode !== 200 || !result.stream) {
    throw new AppError(503, "RATE_LIMIT_UNAVAILABLE", "Không thể đọc giới hạn đăng nhập");
  }
  try {
    const payload = JSON.parse(await new Response(result.stream).text()) as unknown;
    return { document: parseDurableBuckets(payload), etag: result.blob.etag };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(503, "RATE_LIMIT_UNAVAILABLE", "Dữ liệu giới hạn đăng nhập không hợp lệ");
  }
}

/**
 * Vercel Functions do not share memory. For the public administrator login we
 * therefore keep both IP and email buckets in one small private Blob and use
 * ETag compare-and-swap. Other low-risk catalog endpoints retain the bounded
 * per-instance limiter to avoid spending Blob operations on every page view.
 */
async function enforceDurableAdminLoginLimits(rules: readonly RateLimitRule[]): Promise<void> {
  const token = catalogBlobToken();
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const current = await readDurableBuckets(token);
    const now = Date.now();
    const buckets = Object.fromEntries(
      Object.entries(current.document.buckets).filter(([, bucket]) => bucket.expiresAt > now),
    ) as Record<string, MemoryBucket>;

    for (const rule of rules) {
      const windowMs = rule.windowSeconds * 1000;
      const windowStart = Math.floor(now / windowMs) * windowMs;
      const key = `${rule.action}:${rateLimitKeyHash(rule.key)}`;
      const previous = buckets[key];
      const count = previous?.expiresAt === windowStart + windowMs ? previous.count : 0;
      if (count >= rule.limit) {
        throw new AppError(429, "RATE_LIMITED", "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.");
      }
      buckets[key] = { count: count + 1, expiresAt: windowStart + windowMs };
    }
    if (Object.keys(buckets).length > MAX_DURABLE_BUCKETS) {
      throw new AppError(503, "RATE_LIMIT_UNAVAILABLE", "Giới hạn đăng nhập đang quá tải");
    }

    try {
      await put(ADMIN_LOGIN_BUCKET_PATH, JSON.stringify({ version: 1, buckets } satisfies DurableBucketDocument), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: current.etag !== null,
        ifMatch: current.etag ?? undefined,
        contentType: "application/json; charset=utf-8",
        cacheControlMaxAge: 60,
        token,
      });
      return;
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError || (current.etag === null && (await readDurableBuckets(token)).etag !== null)) {
        continue;
      }
      throw new AppError(503, "RATE_LIMIT_UNAVAILABLE", "Không thể cập nhật giới hạn đăng nhập");
    }
  }
  throw new AppError(503, "RATE_LIMIT_UNAVAILABLE", "Có quá nhiều yêu cầu đăng nhập đồng thời");
}

async function enforceDatabaseRateLimit(rule: RateLimitRule): Promise<void> {
  let secret: string;
  try {
    secret = requireSecret("RATE_LIMIT_SECRET");
  } catch {
    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") return;
    throw new AppError(503, "RATE_LIMIT_UNAVAILABLE", "Không thể kiểm tra giới hạn yêu cầu");
  }
  const keyHash = hmacSha256(secret, rule.key.trim().toLowerCase());
  const db = getDatabase();
  try {
    const result = await db.execute<{ count: number }>(sql`
      insert into rate_limit_buckets (key_hash, action, window_start, count, expires_at)
      values (
        ${keyHash},
        ${rule.action},
        to_timestamp(floor(extract(epoch from now()) / ${rule.windowSeconds}) * ${rule.windowSeconds}),
        1,
        to_timestamp(floor(extract(epoch from now()) / ${rule.windowSeconds}) * ${rule.windowSeconds}) + (${rule.windowSeconds} * interval '1 second')
      )
      on conflict (key_hash, action, window_start)
      do update set count = rate_limit_buckets.count + 1
      returning count
    `);
    const count = Number(result.rows[0]?.count ?? rule.limit + 1);
    if (count > rule.limit) throw new AppError(429, "RATE_LIMITED", "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.");
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(503, "RATE_LIMIT_UNAVAILABLE", "Không thể kiểm tra giới hạn yêu cầu");
  }
}

export async function enforceRateLimit(rule: RateLimitRule): Promise<void> {
  if (usesPostgresCatalogBackend() && hasDatabaseUrl()) {
    await enforceDatabaseRateLimit(rule);
    return;
  }
  enforceMemoryRateLimit(rule);
}

export async function enforceAllRateLimits(rules: readonly RateLimitRule[]): Promise<void> {
  if (
    getCatalogBackend() === "vercel-blob"
    && rules.length > 0
    && rules.every((rule) => rule.action.startsWith("admin-login-"))
  ) {
    await enforceDurableAdminLoginLimits(rules);
    return;
  }
  for (const rule of rules) await enforceRateLimit(rule);
}
