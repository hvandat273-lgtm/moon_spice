import { z } from "zod";

const slug = z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const uuid = z.string().uuid();
const optionalHttpsUrl = z.union([
  z.literal(""),
  z.string().trim().url().max(2048).refine((value) => new URL(value).protocol === "https:", "URL phải dùng HTTPS"),
]).optional();

export const adminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).refine((value) => {
    const bytes = Buffer.byteLength(value, "utf8");
    return bytes >= 12 && bytes <= 72;
  }, "Mật khẩu phải có từ 12 đến 72 byte UTF-8"),
}).strict();

const productImageSchema = z.object({
  id: uuid.optional(),
  url: z.string().trim().min(1).max(2048),
  alt: z.string().trim().max(180),
  storageProvider: z.enum(["LOCAL", "VERCEL_BLOB"]),
  blobPathname: z.string().trim().max(512).nullable().optional(),
  role: z.enum(["GALLERY", "HERO_CUTOUT", "HERO_BACKGROUND", "HERO_BACKGROUND_MOBILE", "FEATURED_BACKGROUND", "FEATURED_BACKGROUND_MOBILE", "INGREDIENT_SHOWCASE", "USAGE"]).default("GALLERY"),
  focalX: z.number().int().min(0).max(100).default(50),
  focalY: z.number().int().min(0).max(100).default(50),
  isPrimary: z.boolean(),
  sortOrder: z.number().int().min(0).max(100),
}).strict();

const productVariantSchema = z.object({
  id: uuid.optional(),
  sku: z.string().trim().toUpperCase().min(2).max(64).regex(/^[A-Z0-9][A-Z0-9._-]*$/),
  weightGrams: z.number().int().min(1).max(100_000),
  price: z.number().int().min(0).max(1_000_000_000),
  originalPrice: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
  stock: z.number().int().min(0).max(1_000_000),
  active: z.boolean(),
  version: z.number().int().positive().optional(),
  expectedVersion: z.number().int().positive().optional(),
  stockReason: z.string().trim().max(500).optional(),
}).strict().refine((value) => value.originalPrice == null || value.originalPrice >= value.price, {
  message: "Giá gốc phải lớn hơn hoặc bằng giá bán",
  path: ["originalPrice"],
});

const usageSuggestionSchema = z.object({
  id: uuid.optional(),
  productImageId: uuid,
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().max(200).nullable().optional(),
  sortOrder: z.number().int().min(0).max(10_000),
  active: z.boolean(),
}).strict();

export const adminProductSchema = z.object({
  expectedUpdatedAt: z.string().datetime({ offset: true }).optional(),
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
  images: z.array(productImageSchema).max(12),
  variants: z.array(productVariantSchema).min(1).max(20),
  suggestions: z.array(usageSuggestionSchema).max(4),
}).strict().superRefine((value, context) => {
  const skus = new Set<string>();
  const weights = new Set<number>();
  for (const [index, variant] of value.variants.entries()) {
    if (skus.has(variant.sku)) context.addIssue({ code: "custom", message: "SKU bị trùng", path: ["variants", index, "sku"] });
    if (weights.has(variant.weightGrams)) context.addIssue({ code: "custom", message: "Khối lượng bị trùng", path: ["variants", index, "weightGrams"] });
    skus.add(variant.sku);
    weights.add(variant.weightGrams);
  }
  if (value.images.filter((image) => image.isPrimary).length > 1) {
    context.addIssue({ code: "custom", message: "Chỉ được chọn một ảnh chính", path: ["images"] });
  }
  if (!value.variants.some((variant) => variant.active)) {
    context.addIssue({ code: "custom", message: "Cần ít nhất một biến thể đang hoạt động", path: ["variants"] });
  }
  const usageImages = new Set(value.images.filter((image) => image.role === "USAGE" && image.id).map((image) => image.id));
  const suggestionSortOrders = new Set<number>();
  for (const [index, suggestion] of value.suggestions.entries()) {
    if (!usageImages.has(suggestion.productImageId)) context.addIssue({ code: "custom", message: "Gợi ý phải dùng ảnh có vai trò USAGE", path: ["suggestions", index, "productImageId"] });
    if (suggestion.active && suggestionSortOrders.has(suggestion.sortOrder)) context.addIssue({ code: "custom", message: "Thứ tự gợi ý đang hoạt động bị trùng", path: ["suggestions", index, "sortOrder"] });
    if (suggestion.active) suggestionSortOrders.add(suggestion.sortOrder);
  }
});

export const adminCategorySchema = z.object({
  expectedUpdatedAt: z.string().datetime({ offset: true }).optional(),
  name: z.string().trim().min(2).max(120),
  slug,
  description: z.string().trim().max(500).default(""),
  imageUrl: z.string().trim().max(2048).default(""),
  imageStorageProvider: z.enum(["LOCAL", "VERCEL_BLOB"]).nullable().optional(),
  imageBlobPathname: z.string().trim().max(1024).nullable().optional(),
  imageAlt: z.string().trim().max(180).default(""),
  sortOrder: z.number().int().min(0).max(10_000),
  active: z.boolean(),
}).strict();

export const adminOrderStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "PREPARING", "SHIPPING", "DELIVERY_FAILED", "RETURNED", "COMPLETED", "CANCELLED"]),
  expectedStatus: z.enum(["PENDING", "CONFIRMED", "PREPARING", "SHIPPING", "DELIVERY_FAILED", "RETURNED", "COMPLETED", "CANCELLED"]),
  reason: z.string().trim().min(3).max(500),
  paymentReceived: z.boolean().optional(),
  returnDisposition: z.enum(["RESTOCKED", "DISCARDED"]).optional(),
}).strict();

export const adminReviewSchema = z.object({ approved: z.boolean() }).strict();

export const adminSettingsSchema = z.object({
  expectedRevision: z.number().int().min(0).optional(),
    heroProductId: uuid.nullable(),
    featuredProductId: uuid.nullable(),
  homepageBestSellerLimit: z.number().int().min(1).max(12),
  freeShippingThreshold: z.number().int().min(0).max(1_000_000_000),
  defaultShippingFee: z.number().int().min(0).max(1_000_000_000),
  pendingOrderExpiryHours: z.number().int().min(1).max(168),
  orderPiiRetentionDays: z.number().int().min(30).max(3650),
  orderAssetRetentionDays: z.number().int().min(30).max(3650),
  announcementText: z.string().trim().max(160),
  storeContact: z.object({
    phone: z.string().trim().max(24).optional(),
    email: z.union([z.literal(""), z.string().trim().email().max(254)]).optional(),
    address: z.string().trim().max(250).optional(),
    facebookUrl: optionalHttpsUrl,
    instagramUrl: optionalHttpsUrl,
    amazonUrl: optionalHttpsUrl,
  }).strict(),
}).strict();

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  q: z.string().trim().max(120).default(""),
  status: z.string().trim().max(32).default(""),
}).strict();
