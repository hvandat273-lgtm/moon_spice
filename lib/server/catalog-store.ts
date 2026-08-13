import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { BlobPreconditionFailedError, get, put } from "@vercel/blob";
import { z } from "zod";
import { cache } from "react";

export type CatalogBackend = "bundled-json" | "local-json" | "vercel-blob" | "postgres";

const CATALOG_BLOB_PATHNAME = "moon-spice/catalog/v1/catalog.json";
const LOCAL_CATALOG_PATH = path.join(process.cwd(), ".data", "catalog.json");
const BUNDLED_SHOWCASE_PATH = path.join(process.cwd(), "data", "showcase-catalog.json");

function localCatalogPath(): string {
  const persistentRuntimeOverride = process.env.RENDER
    ? process.env.CATALOG_LOCAL_PATH?.trim()
    : undefined;
  const e2eOverrideAllowed =
    process.env.E2E_TEST === "1" &&
    !process.env.VERCEL &&
    process.env.DEPLOYMENT_MODE !== "production";
  const testOverride = process.env.NODE_ENV === "test" || e2eOverrideAllowed
    ? process.env.CATALOG_LOCAL_PATH?.trim()
    : undefined;
  return path.resolve(persistentRuntimeOverride || testOverride || LOCAL_CATALOG_PATH);
}

function usesPersistentRenderCatalogPath(): boolean {
  return Boolean(process.env.RENDER && process.env.CATALOG_LOCAL_PATH?.trim());
}
const isoDate = z.string().datetime({ offset: true });
const uuid = z.string().uuid();
const slug = z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const assetUrl = z.string().trim().min(1).max(2048).refine((value) => value.startsWith("/") || value.startsWith("https://"));

const categorySchema = z.object({
  id: uuid,
  name: z.string().trim().min(2).max(120),
  slug,
  description: z.string().trim().max(500).default(""),
  imageUrl: z.string().trim().max(2048).default(""),
  imageAlt: z.string().trim().max(180).default(""),
  sortOrder: z.number().int().min(0).max(10_000),
  active: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
}).strict();

const productSchema = z.object({
  id: uuid,
  categoryId: uuid,
  name: z.string().trim().min(2).max(160),
  slug,
  shortDescription: z.string().trim().min(10).max(320),
  description: z.string().trim().min(20).max(10_000),
  ingredients: z.string().trim().max(4_000).default(""),
  usage: z.string().trim().max(4_000).default(""),
  storageInstructions: z.string().trim().max(2_000).default(""),
  origin: z.string().trim().max(120).default(""),
  manufacturer: z.string().trim().max(180).default(""),
  distributor: z.string().trim().max(180).default(""),
  shelfLife: z.string().trim().max(180).default(""),
  allergenWarning: z.string().trim().max(2_000).default(""),
  nutritionInfo: z.string().trim().max(4_000).default(""),
  bestSeller: z.boolean(),
  active: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
}).strict();

const productImageSchema = z.object({
  id: uuid,
  productId: uuid,
  url: assetUrl,
  alt: z.string().trim().max(180),
  storageProvider: z.enum(["LOCAL", "VERCEL_BLOB"]),
  blobPathname: z.string().trim().min(1).max(512).nullable().default(null),
  role: z.enum(["GALLERY", "HERO_CUTOUT", "HERO_BACKGROUND", "HERO_BACKGROUND_MOBILE", "FEATURED_BACKGROUND", "FEATURED_BACKGROUND_MOBILE", "INGREDIENT_SHOWCASE", "USAGE"]),
  focalX: z.number().int().min(0).max(100),
  focalY: z.number().int().min(0).max(100),
  isPrimary: z.boolean(),
  sortOrder: z.number().int().min(0).max(10_000),
  createdAt: isoDate,
}).strict().superRefine((image, context) => {
  if (image.storageProvider === "LOCAL" && (!image.url.startsWith("/") || image.blobPathname !== null)) {
    context.addIssue({ code: "custom", message: "LOCAL image must use a local URL without blobPathname" });
  }
  if (image.storageProvider === "VERCEL_BLOB" && (!image.url.startsWith("https://") || !image.blobPathname)) {
    context.addIssue({ code: "custom", message: "VERCEL_BLOB image must use HTTPS and a blobPathname" });
  }
  if (image.isPrimary && !["GALLERY", "HERO_CUTOUT"].includes(image.role)) {
    context.addIssue({ code: "custom", message: "Primary image role must be GALLERY or HERO_CUTOUT" });
  }
});

const variantSchema = z.object({
  id: uuid,
  productId: uuid,
  sku: z.string().trim().min(2).max(64).regex(/^[A-Z0-9][A-Z0-9._-]*$/),
  weightGrams: z.number().int().min(1).max(100_000),
  price: z.number().int().min(0).max(1_000_000_000),
  originalPrice: z.number().int().min(0).max(1_000_000_000).nullable().default(null),
  stock: z.number().int().min(0).max(1_000_000),
  version: z.number().int().positive(),
  active: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
}).strict().refine((variant) => variant.originalPrice === null || variant.originalPrice >= variant.price, {
  message: "originalPrice must be greater than or equal to price",
  path: ["originalPrice"],
});

const usageSuggestionSchema = z.object({
  id: uuid,
  productId: uuid,
  productImageId: uuid,
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().max(200).nullable().default(null),
  sortOrder: z.number().int().min(0).max(10_000),
  active: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
}).strict();

const reviewSchema = z.object({
  id: uuid,
  productId: uuid,
  customerName: z.string().trim().min(1).max(120),
  rating: z.number().int().min(1).max(5),
  content: z.string().trim().min(1).max(2_000),
  source: z.enum(["VERIFIED", "IMPORTED", "DEMO"]),
  approved: z.boolean(),
  reviewedAt: isoDate,
  createdAt: isoDate,
}).strict();

const storeContactSchema = z.object({
  phone: z.string().trim().max(24).optional(),
  email: z.string().trim().email().max(254).optional(),
  address: z.string().trim().max(250).optional(),
  facebookUrl: z.string().trim().url().max(2048).refine((value) => new URL(value).protocol === "https:").optional(),
  instagramUrl: z.string().trim().url().max(2048).refine((value) => new URL(value).protocol === "https:").optional(),
  amazonUrl: z.string().trim().url().max(2048).refine((value) => new URL(value).protocol === "https:").optional(),
}).strict();

const settingsSchema = z.object({
  heroProductId: uuid.nullable(),
  featuredProductId: uuid.nullable(),
  homepageBestSellerLimit: z.number().int().min(1).max(12),
  freeShippingThreshold: z.number().int().min(0).max(1_000_000_000),
  defaultShippingFee: z.number().int().min(0).max(1_000_000_000),
  pendingOrderExpiryHours: z.number().int().min(1).max(168),
  orderPiiRetentionDays: z.number().int().min(30).max(3650),
  orderAssetRetentionDays: z.number().int().min(30).max(3650),
  storeContact: storeContactSchema,
  announcementText: z.string().trim().max(160),
}).strict();

const catalogDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  revision: z.number().int().min(0),
  updatedAt: isoDate,
  categories: z.array(categorySchema).max(10_000),
  products: z.array(productSchema).max(100_000),
  productImages: z.array(productImageSchema).max(1_200_000),
  productVariants: z.array(variantSchema).max(2_000_000),
  usageSuggestions: z.array(usageSuggestionSchema).max(400_000),
  reviews: z.array(reviewSchema).max(2_000_000),
  settings: settingsSchema,
}).strict().superRefine((document, context) => {
  const categoryIds = uniqueValues(document.categories, (record) => record.id, "categories.id", context);
  uniqueValues(document.categories, (record) => record.slug, "categories.slug", context);
  const productIds = uniqueValues(document.products, (record) => record.id, "products.id", context);
  uniqueValues(document.products, (record) => record.slug, "products.slug", context);
  const imageIds = uniqueValues(document.productImages, (record) => record.id, "productImages.id", context);
  uniqueValues(document.productVariants, (record) => record.id, "productVariants.id", context);
  uniqueValues(document.productVariants, (record) => record.sku, "productVariants.sku", context);
  uniqueValues(document.usageSuggestions, (record) => record.id, "usageSuggestions.id", context);
  uniqueValues(document.reviews, (record) => record.id, "reviews.id", context);
  const globalIds = new Set<string>();
  for (const [collection, records] of [
    ["categories", document.categories],
    ["products", document.products],
    ["productImages", document.productImages],
    ["productVariants", document.productVariants],
    ["usageSuggestions", document.usageSuggestions],
    ["reviews", document.reviews],
  ] as const) {
    for (const [index, record] of records.entries()) {
      if (globalIds.has(record.id)) issue(context, [collection, index, "id"], "Record IDs must be globally unique");
      globalIds.add(record.id);
    }
  }

  for (const [index, product] of document.products.entries()) {
    if (!categoryIds.has(product.categoryId)) issue(context, ["products", index, "categoryId"], "Unknown categoryId");
  }
  validateChildren(document.productImages, "productImages", productIds, context);
  validateChildren(document.productVariants, "productVariants", productIds, context);
  validateChildren(document.usageSuggestions, "usageSuggestions", productIds, context);
  validateChildren(document.reviews, "reviews", productIds, context);

  const weights = new Set<string>();
  for (const [index, variant] of document.productVariants.entries()) {
    const key = `${variant.productId}:${variant.weightGrams}`;
    if (weights.has(key)) issue(context, ["productVariants", index, "weightGrams"], "Duplicate product weight");
    weights.add(key);
  }
  const primaryProducts = new Set<string>();
  const placementRoles = new Set<string>();
  for (const [index, image] of document.productImages.entries()) {
    if (image.isPrimary && primaryProducts.has(image.productId)) issue(context, ["productImages", index, "isPrimary"], "Only one primary image is allowed per product");
    if (image.isPrimary) primaryProducts.add(image.productId);
    if (!["GALLERY", "USAGE"].includes(image.role)) {
      const key = `${image.productId}:${image.role}`;
      if (placementRoles.has(key)) issue(context, ["productImages", index, "role"], "Placement role must be unique per product");
      placementRoles.add(key);
    }
  }
  const suggestionImages = new Set<string>();
  const activeSuggestionOrders = new Set<string>();
  for (const [index, suggestion] of document.usageSuggestions.entries()) {
    const image = document.productImages.find((record) => record.id === suggestion.productImageId);
    if (!imageIds.has(suggestion.productImageId) || !image || image.productId !== suggestion.productId || image.role !== "USAGE") {
      issue(context, ["usageSuggestions", index, "productImageId"], "Suggestion must reference a USAGE image from the same product");
    }
    if (suggestionImages.has(suggestion.productImageId)) issue(context, ["usageSuggestions", index, "productImageId"], "Suggestion image is already used");
    suggestionImages.add(suggestion.productImageId);
    if (suggestion.active) {
      const key = `${suggestion.productId}:${suggestion.sortOrder}`;
      if (activeSuggestionOrders.has(key)) issue(context, ["usageSuggestions", index, "sortOrder"], "Active suggestion sort order must be unique per product");
      activeSuggestionOrders.add(key);
    }
  }
  for (const [key, productId] of [["heroProductId", document.settings.heroProductId], ["featuredProductId", document.settings.featuredProductId]] as const) {
    if (productId !== null && !productIds.has(productId)) issue(context, ["settings", key], "Homepage product does not exist");
  }
});

export type CatalogCategoryRecord = z.infer<typeof categorySchema>;
export type CatalogProductRecord = z.infer<typeof productSchema>;
export type CatalogProductImageRecord = z.infer<typeof productImageSchema>;
export type CatalogProductVariantRecord = z.infer<typeof variantSchema>;
export type CatalogUsageSuggestionRecord = z.infer<typeof usageSuggestionSchema>;
export type CatalogReviewRecord = z.infer<typeof reviewSchema>;
export type CatalogSettingsRecord = z.infer<typeof settingsSchema>;
export type CatalogDocument = z.infer<typeof catalogDocumentSchema>;

function issue(context: z.RefinementCtx, pathValue: PropertyKey[], message: string): void {
  context.addIssue({ code: "custom", path: pathValue, message });
}

function uniqueValues<T>(records: T[], select: (record: T) => string, label: string, context: z.RefinementCtx): Set<string> {
  const values = new Set<string>();
  for (const [index, record] of records.entries()) {
    const value = select(record);
    if (values.has(value)) issue(context, [label.split(".")[0], index, label.split(".")[1]], `Duplicate ${label}`);
    values.add(value);
  }
  return values;
}

function validateChildren<T extends { productId: string }>(records: T[], collection: string, productIds: Set<string>, context: z.RefinementCtx): void {
  for (const [index, record] of records.entries()) {
    if (!productIds.has(record.productId)) issue(context, [collection, index, "productId"], "Unknown productId");
  }
}

export function emptyCatalogDocument(): CatalogDocument {
  return {
    schemaVersion: 1,
    revision: 0,
    updatedAt: new Date(0).toISOString(),
    categories: [],
    products: [],
    productImages: [],
    productVariants: [],
    usageSuggestions: [],
    reviews: [],
    settings: {
      heroProductId: null,
      featuredProductId: null,
      homepageBestSellerLimit: 8,
      freeShippingThreshold: 500_000,
      defaultShippingFee: 30_000,
      pendingOrderExpiryHours: 48,
      orderPiiRetentionDays: 730,
      orderAssetRetentionDays: 730,
      storeContact: {},
      announcementText: "MOOR SPICE 公式オンラインカタログ",
    },
  };
}

export function parseCatalogDocument(value: unknown): CatalogDocument {
  return catalogDocumentSchema.parse(value);
}

export function getCatalogBackend(): CatalogBackend {
  const configured = process.env.CATALOG_BACKEND?.trim();
  if (configured) {
    const backend = z.enum(["local-json", "vercel-blob", "postgres"]).parse(configured);
    // A local-json value often arrives on a first Vercel deploy by copying the
    // development env file. Treat it as the same safe read-only showcase
    // fallback instead of crashing every public request.
    if (backend === "local-json" && process.env.VERCEL) return "bundled-json";
    return backend;
  }
  if (process.env.DATABASE_URL?.trim()) return "postgres";
  // A fresh Vercel project has no persistent catalog configured yet. Keep the
  // public storefront available from the versioned showcase document while
  // the admin remains fail-closed through lib/server/env.ts. This backend is
  // intentionally read-only; configuring Blob or Postgres takes precedence.
  if (process.env.VERCEL) return "bundled-json";
  if (process.env.DEPLOYMENT_MODE === "production") {
    throw new Error("CATALOG_BACKEND must be explicitly configured on Vercel/production");
  }
  return "local-json";
}

function requireCatalogBlobToken(): string {
  const token = process.env.CATALOG_BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) throw new Error("CATALOG_BLOB_READ_WRITE_TOKEN is required for CATALOG_BACKEND=vercel-blob");
  return token;
}

async function readLocalDocument(): Promise<CatalogDocument> {
  const localPath = localCatalogPath();
  try {
    return parseCatalogDocument(JSON.parse(await readFile(localPath, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      if (usesPersistentRenderCatalogPath()) {
        try {
          const bundled = parseCatalogDocument(JSON.parse(await readFile(BUNDLED_SHOWCASE_PATH, "utf8")));
          await writeLocalDocument(bundled);
          return bundled;
        } catch (bundledError) {
          if ((bundledError as NodeJS.ErrnoException).code !== "ENOENT") throw bundledError;
        }
      }
      return emptyCatalogDocument();
    }
    throw error;
  }
}

async function readBundledDocument(): Promise<CatalogDocument> {
  return parseCatalogDocument(JSON.parse(await readFile(BUNDLED_SHOWCASE_PATH, "utf8")));
}

async function readBlobDocument(): Promise<{ document: CatalogDocument; etag: string | null }> {
  const result = await get(CATALOG_BLOB_PATHNAME, { access: "private", useCache: false, token: requireCatalogBlobToken() });
  if (!result) return { document: emptyCatalogDocument(), etag: null };
  if (result.statusCode !== 200 || !result.stream) throw new Error("Catalog Blob returned no readable content");
  const text = await new Response(result.stream).text();
  return { document: parseCatalogDocument(JSON.parse(text)), etag: result.blob.etag };
}

async function readCatalogDocumentUncached(): Promise<CatalogDocument> {
  const backend = getCatalogBackend();
  if (backend === "bundled-json") return readBundledDocument();
  if (backend === "local-json") return readLocalDocument();
  if (backend === "vercel-blob") return (await readBlobDocument()).document;
  throw new Error("Catalog document store is not used when CATALOG_BACKEND=postgres");
}

// Dedupe reads within one React server render. Administrative reads and CAS
// mutation preconditions request a fresh snapshot explicitly.
const readCatalogDocumentForRender = cache(readCatalogDocumentUncached);

export async function readCatalogDocument(options: { fresh?: boolean } = {}): Promise<CatalogDocument> {
  return options.fresh ? readCatalogDocumentUncached() : readCatalogDocumentForRender();
}

let localMutationQueue: Promise<void> = Promise.resolve();

async function withLocalMutationLock<T>(operation: () => Promise<T>): Promise<T> {
  let release!: () => void;
  const previous = localMutationQueue;
  localMutationQueue = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  try { return await operation(); } finally { release(); }
}

async function writeLocalDocument(document: CatalogDocument): Promise<void> {
  const localPath = localCatalogPath();
  await mkdir(path.dirname(localPath), { recursive: true });
  const temporaryPath = `${localPath}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(document, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  await rename(temporaryPath, localPath);
}

async function prepareMutation<T>(source: CatalogDocument, mutation: (draft: CatalogDocument) => T | Promise<T>): Promise<{ document: CatalogDocument; result: T }> {
  const draft = structuredClone(source);
  const result = await mutation(draft);
  draft.revision = source.revision + 1;
  draft.updatedAt = new Date().toISOString();
  return { document: parseCatalogDocument(draft), result };
}

async function mutateBlobDocument<T>(mutation: (draft: CatalogDocument) => T | Promise<T>): Promise<{ document: CatalogDocument; result: T }> {
  const token = requireCatalogBlobToken();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const current = await readBlobDocument();
    const next = await prepareMutation(current.document, mutation);
    try {
      await put(CATALOG_BLOB_PATHNAME, JSON.stringify(next.document), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: current.etag !== null,
        ifMatch: current.etag ?? undefined,
        contentType: "application/json; charset=utf-8",
        cacheControlMaxAge: 60,
        token,
      });
      return next;
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError || (current.etag === null && (await readBlobDocument()).etag !== null)) continue;
      throw error;
    }
  }
  throw new Error("Catalog update conflicted repeatedly; retry the operation");
}

export async function mutateCatalogDocument<T>(mutation: (draft: CatalogDocument) => T | Promise<T>): Promise<{ document: CatalogDocument; result: T }> {
  const backend = getCatalogBackend();
  if (backend === "bundled-json") throw new Error("The bundled catalog is read-only; configure vercel-blob or postgres before editing");
  if (backend === "vercel-blob") return mutateBlobDocument(mutation);
  if (backend === "postgres") throw new Error("Catalog document mutations are not used when CATALOG_BACKEND=postgres");
  return withLocalMutationLock(async () => {
    const next = await prepareMutation(await readLocalDocument(), mutation);
    await writeLocalDocument(next.document);
    return next;
  });
}
