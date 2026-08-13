import { sql } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import { readCatalogDocument } from "@/lib/server/catalog-store";
import { apiSuccess, clientIpFrom, route } from "@/lib/server/api";
import { assertAdminAuthenticationConfigured, readAdminSession } from "@/lib/server/auth";
import { assertProductionDatabaseIdentity, assertProductionEnvironment, getCatalogBackend, requireSecret } from "@/lib/server/env";
import { AppError } from "@/lib/server/errors";
import { enforceRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authorize(request: Request): Promise<void> {
  try {
    const expected = requireSecret("HEALTHCHECK_SECRET");
    if (request.headers.get("authorization") === `Bearer ${expected}`) return;
  } catch {
    // An active admin session remains a supported readiness credential.
  }
  if (await readAdminSession(request)) return;
  throw new AppError(401, "UNAUTHORIZED", "Không có quyền truy cập");
}

function requireConfiguredCatalogBackend() {
  try {
    const backend = getCatalogBackend();
    if (backend) return backend;
  } catch {
    // Invalid enum values are deployment configuration failures, not bad requests.
  }
  throw new AppError(503, "CATALOG_NOT_CONFIGURED", "Nguồn dữ liệu danh mục chưa được cấu hình hợp lệ");
}

function assertPublicImageStorageConfigured(): void {
  const adapter = process.env.STORAGE_ADAPTER?.trim() || "local";
  if (adapter === "vercel-blob") {
    if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) return;
    throw new AppError(503, "IMAGE_STORAGE_NOT_CONFIGURED", "Kho ảnh công khai chưa có BLOB_READ_WRITE_TOKEN");
  }
  if (adapter === "local" && process.env.NODE_ENV !== "production" && !process.env.VERCEL) return;
  if (adapter === "local" && process.env.RENDER && process.env.SQLITE_PERSISTENCE_CONFIRMED === "true") return;
  throw new AppError(503, "IMAGE_STORAGE_NOT_CONFIGURED", "Kho ảnh công khai chưa được cấu hình cho môi trường triển khai");
}

export async function GET(request: Request) {
  return route(request, async (requestId) => {
    assertProductionEnvironment();
    await authorize(request);
    await enforceRateLimit({ action: "readiness-ip", key: clientIpFrom(request), limit: 10, windowSeconds: 60 });
    const backend = requireConfiguredCatalogBackend();
    if (backend === "local-json" || backend === "vercel-blob") {
      // This also validates the dedicated private catalog token for Blob-backed
      // catalogs and all stateless administrator credentials.
      assertAdminAuthenticationConfigured();
      assertPublicImageStorageConfigured();
      try {
        const catalog = await readCatalogDocument({ fresh: true });
        return apiSuccess({ status: "ready", backend, revision: catalog.revision }, requestId);
      } catch {
        throw new AppError(503, "CATALOG_UNAVAILABLE", "Không thể đọc hoặc xác thực dữ liệu danh mục");
      }
    }
    await getDatabase().execute(sql`select 1 as ready`);
    await assertProductionDatabaseIdentity();
    return apiSuccess({ status: "ready", backend: "postgres" }, requestId);
  });
}
