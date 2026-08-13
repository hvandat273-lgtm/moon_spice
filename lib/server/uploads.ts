import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { del, put } from "@vercel/blob";
import sharp, { type Metadata } from "sharp";

import { getDatabase, hasDatabaseUrl } from "@/db/client";
import { blobCleanupJobs } from "@/db/schema";
import { CATALOG_IMAGE_PLACEHOLDER } from "@/lib/catalog-image";

import { readCatalogDocument } from "./catalog-store";
import { AppError } from "./errors";
import { assertProductionEnvironment, usesJsonCatalogBackend, usesPostgresCatalogBackend } from "./env";

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const MAX_DIMENSION = 4096;
const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export interface UploadedImage {
  url: string;
  pathname: string | null;
  storageProvider: "LOCAL" | "VERCEL_BLOB";
  width: number;
  height: number;
  contentType: "image/webp";
  size: number;
}

function publicBlobStoreId(): string | null {
  const parts = process.env.BLOB_READ_WRITE_TOKEN?.split("_") ?? [];
  return parts[0] === "vercel" && parts[1] === "blob" && parts[2] === "rw" && /^[a-zA-Z0-9]+$/.test(parts[3] ?? "")
    ? parts[3]
    : null;
}

function ownedPublicBlobPathnameFromUrl(url: string): string | null {
  const storeId = publicBlobStoreId();
  if (!storeId) return null;
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.replace(/^\//, "");
    return parsed.protocol === "https:"
      && parsed.hostname === `${storeId}.public.blob.vercel-storage.com`
      && pathname.startsWith("moon-spice/")
      ? pathname
      : null;
  } catch {
    return null;
  }
}

function assertOwnedPublicBlobPathname(pathname: string): void {
  if (!publicBlobStoreId() || !pathname.startsWith("moon-spice/") || pathname.includes("..") || pathname.length > 1024) {
    throw new AppError(400, "INVALID_IMAGE_REFERENCE", "Blob ảnh không thuộc kho ảnh của Moon Spice");
  }
}

/** Delete only public image Blobs that a fresh JSON catalog no longer references. */
export async function deleteUnreferencedCatalogBlobImages(pathnames: readonly string[]): Promise<{ deleted: string[]; referenced: string[] }> {
  if (!usesJsonCatalogBackend()) throw new AppError(409, "WRONG_STORAGE_MODE", "Chỉ dọn ảnh trực tiếp trong chế độ catalog JSON");
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token || (process.env.STORAGE_ADAPTER ?? "local") !== "vercel-blob") {
    throw new AppError(503, "STORAGE_UNAVAILABLE", "Kho ảnh Blob chưa được cấu hình");
  }
  const candidates = [...new Set(pathnames.map((pathname) => pathname.trim()).filter(Boolean))];
  for (const pathname of candidates) assertOwnedPublicBlobPathname(pathname);
  if (candidates.length === 0) return { deleted: [], referenced: [] };

  const document = await readCatalogDocument({ fresh: true });
  const references = new Set(document.productImages.flatMap((image) => image.storageProvider === "VERCEL_BLOB" && image.blobPathname ? [image.blobPathname] : []));
  for (const category of document.categories) {
    const pathname = ownedPublicBlobPathnameFromUrl(category.imageUrl);
    if (pathname) references.add(pathname);
  }
  const referenced = candidates.filter((pathname) => references.has(pathname));
  const deleted = candidates.filter((pathname) => !references.has(pathname));
  if (deleted.length > 0) await del(deleted, { token });
  return { deleted, referenced };
}

export async function uploadImage(file: File, options: { scope?: string } = {}): Promise<UploadedImage> {
  if (usesPostgresCatalogBackend()) assertProductionEnvironment();
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) throw new AppError(400, "IMAGE_REQUIRED", "Vui lòng chọn ảnh");
  if (file.size > MAX_UPLOAD_BYTES) throw new AppError(413, "IMAGE_TOO_LARGE", "Ảnh không được vượt quá 3 MiB");
  if (!ALLOWED_CONTENT_TYPES.has(file.type.toLowerCase())) throw new AppError(400, "INVALID_IMAGE_TYPE", "Chỉ chấp nhận JPEG, PNG, WebP hoặc AVIF");
  const original = Buffer.from(await file.arrayBuffer());
  let metadata: Metadata;
  try {
    metadata = await sharp(original, { failOn: "warning", limitInputPixels: MAX_DIMENSION * MAX_DIMENSION }).metadata();
  } catch {
    throw new AppError(400, "INVALID_IMAGE", "Tệp tải lên không phải ảnh hợp lệ");
  }
  const decodedFormatAllowed = ["jpeg", "png", "webp", "avif"].includes(metadata.format ?? "")
    || (metadata.format === "heif" && file.type.toLowerCase() === "image/avif");
  if (!metadata.width || !metadata.height || !decodedFormatAllowed) {
    throw new AppError(400, "INVALID_IMAGE", "Chỉ chấp nhận JPEG, PNG, WebP hoặc AVIF");
  }
  if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
    throw new AppError(400, "IMAGE_DIMENSIONS_EXCEEDED", `Kích thước ảnh tối đa là ${MAX_DIMENSION}px`);
  }
  const output = await sharp(original)
    .rotate()
    .webp({ quality: 86, effort: 4 })
    .toBuffer({ resolveWithObject: true });
  const scope = (options.scope ?? "catalog").toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 48) || "catalog";
  const filename = `${randomUUID()}.webp`;
  const pathname = `moon-spice/${scope}/${filename}`;
  const adapter = process.env.STORAGE_ADAPTER ?? "local";

  if (adapter === "vercel-blob") {
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new AppError(503, "STORAGE_UNAVAILABLE", "Kho ảnh chưa được cấu hình");
    const blob = await put(pathname, output.data, {
      access: "public",
      addRandomSuffix: true,
      contentType: "image/webp",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    // PostgreSQL uses a cleanup queue for unattached uploads. JSON catalog
    // records keep the Blob pathname in the document and need no database row.
    if (usesPostgresCatalogBackend()) try {
      if (!hasDatabaseUrl()) throw new Error("DATABASE_URL_REQUIRED_FOR_BLOB_TRACKING");
      await getDatabase()
        .insert(blobCleanupJobs)
        .values({
          pathname: blob.pathname,
          reason: "UNATTACHED_UPLOAD",
          nextAttemptAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        })
        .onConflictDoUpdate({
          target: blobCleanupJobs.pathname,
          set: {
            reason: "UNATTACHED_UPLOAD",
            status: "PENDING",
            attempts: 0,
            nextAttemptAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            lastErrorCode: null,
            updatedAt: new Date(),
          },
        });
    } catch {
      await del(blob.url, { token: process.env.BLOB_READ_WRITE_TOKEN }).catch(() => undefined);
      throw new AppError(503, "STORAGE_TRACKING_FAILED", "Không thể ghi nhận ảnh tải lên; ảnh đã được thu hồi");
    }
    return {
      url: blob.url,
      pathname: blob.pathname,
      storageProvider: "VERCEL_BLOB",
      width: output.info.width,
      height: output.info.height,
      contentType: "image/webp",
      size: output.info.size,
    };
  }

  if (adapter === "fake") {
    if (process.env.NODE_ENV !== "test") throw new AppError(503, "STORAGE_UNAVAILABLE", "Fake storage chỉ được dùng trong kiểm thử");
    return {
      url: CATALOG_IMAGE_PLACEHOLDER,
      pathname: null,
      storageProvider: "LOCAL",
      width: output.info.width,
      height: output.info.height,
      contentType: "image/webp",
      size: output.info.size,
    };
  }

  if (process.env.NODE_ENV === "production" && process.env.RENDER && process.env.UPLOADS_PATH?.trim()) {
    const persistentRoot = path.resolve(process.env.UPLOADS_PATH?.trim() || "/var/data/uploads");
    const uploadDirectory = path.join(persistentRoot, scope);
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, filename), output.data, { flag: "wx" });
    return { url: `/api/media/${scope}/${filename}`, pathname: null, storageProvider: "LOCAL", width: output.info.width, height: output.info.height, contentType: "image/webp", size: output.info.size };
  }
  if (process.env.NODE_ENV === "production") throw new AppError(503, "STORAGE_UNAVAILABLE", "Local storage không được dùng trên production");
  const uploadDirectory = path.resolve(process.cwd(), "public", "uploads", scope);
  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(path.join(uploadDirectory, filename), output.data, { flag: "wx" });
  return {
    url: `/uploads/${scope}/${filename}`,
    pathname: null,
    storageProvider: "LOCAL",
    width: output.info.width,
    height: output.info.height,
    contentType: "image/webp",
    size: output.info.size,
  };
}
