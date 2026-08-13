import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
};

export const adminRoleEnum = pgEnum("admin_role", ["OWNER", "ADMIN"]);
export const orderStatusEnum = pgEnum("order_status", [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "SHIPPING",
  "DELIVERY_FAILED",
  "RETURNED",
  "COMPLETED",
  "CANCELLED",
]);
export const paymentMethodEnum = pgEnum("payment_method", ["COD"]);
export const paymentStatusEnum = pgEnum("payment_status", ["UNPAID", "PAID", "FAILED", "REFUNDED"]);
export const reviewSourceEnum = pgEnum("review_source", ["VERIFIED", "IMPORTED", "DEMO"]);
export const blobCleanupStatusEnum = pgEnum("blob_cleanup_status", ["PENDING", "PROCESSING", "DONE", "FAILED"]);
export const imageStorageProviderEnum = pgEnum("image_storage_provider", ["LOCAL", "VERCEL_BLOB"]);
export const productImageRoleEnum = pgEnum("product_image_role", [
  "GALLERY",
  "HERO_CUTOUT",
  "HERO_BACKGROUND",
  "HERO_BACKGROUND_MOBILE",
  "FEATURED_BACKGROUND",
  "FEATURED_BACKGROUND_MOBILE",
  "INGREDIENT_SHOWCASE",
  "USAGE",
]);
export const returnDispositionEnum = pgEnum("return_disposition", ["RESTOCKED", "DISCARDED"]);
export const databaseEnvironmentEnum = pgEnum("database_environment", ["DEVELOPMENT", "TEST", "PREVIEW", "PRODUCTION"]);

export const admins = pgTable(
  "admins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    displayName: text("display_name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: adminRoleEnum("role").notNull().default("ADMIN"),
    active: boolean("active").notNull().default(true),
    passwordChangedAt: timestamp("password_changed_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [
    check("admins_email_normalized", sql`${table.email} = lower(btrim(${table.email}))`),
    check("admins_display_name_not_blank", sql`length(btrim(${table.displayName})) > 0`),
  ],
);

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: uuid("admin_id").notNull().references(() => admins.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("admin_sessions_admin_expires_idx").on(table.adminId, table.expiresAt), index("admin_sessions_expires_idx").on(table.expiresAt)],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    imageUrl: text("image_url"),
    imageStorageProvider: imageStorageProviderEnum("image_storage_provider"),
    imageBlobPathname: text("image_blob_pathname").unique(),
    imageAlt: text("image_alt"),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    check("categories_sort_order_nonnegative", sql`${table.sortOrder} >= 0`),
    check("categories_slug_format", sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`),
    check(
      "categories_asset_shape",
      sql`(${table.imageStorageProvider} is null and ${table.imageUrl} is null and ${table.imageBlobPathname} is null)
          or (${table.imageStorageProvider} = 'LOCAL' and ${table.imageUrl} like '/%' and ${table.imageBlobPathname} is null)
          or (${table.imageStorageProvider} = 'VERCEL_BLOB' and ${table.imageUrl} is not null and ${table.imageBlobPathname} is not null)`,
    ),
    index("categories_active_sort_idx").on(table.active, table.sortOrder),
  ],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    shortDescription: text("short_description").notNull(),
    ingredients: text("ingredients"),
    usage: text("usage"),
    storageInstructions: text("storage_instructions"),
    origin: text("origin"),
    manufacturer: text("manufacturer"),
    distributor: text("distributor"),
    shelfLife: text("shelf_life"),
    allergenWarning: text("allergen_warning"),
    nutritionInfo: text("nutrition_info"),
    bestSeller: boolean("best_seller").notNull().default(false),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    check("products_slug_format", sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`),
    index("products_category_active_idx").on(table.categoryId, table.active),
    index("products_active_bestseller_idx").on(table.active, table.bestSeller),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    storageProvider: imageStorageProviderEnum("storage_provider").notNull(),
    blobPathname: text("blob_pathname").unique(),
    role: productImageRoleEnum("role").notNull().default("GALLERY"),
    alt: text("alt").notNull(),
    focalX: smallint("focal_x").notNull().default(50),
    focalY: smallint("focal_y").notNull().default(50),
    sortOrder: integer("sort_order").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    check("product_images_focal_x_range", sql`${table.focalX} between 0 and 100`),
    check("product_images_focal_y_range", sql`${table.focalY} between 0 and 100`),
    check("product_images_sort_order_nonnegative", sql`${table.sortOrder} >= 0`),
    check(
      "product_images_asset_shape",
      sql`(${table.storageProvider} = 'LOCAL' and ${table.url} like '/%' and ${table.blobPathname} is null)
          or (${table.storageProvider} = 'VERCEL_BLOB' and ${table.url} like 'https://%' and ${table.blobPathname} is not null)`,
    ),
    check("product_images_primary_role", sql`not ${table.isPrimary} or ${table.role} in ('GALLERY', 'HERO_CUTOUT')`),
    uniqueIndex("product_images_one_primary_idx").on(table.productId).where(sql`${table.isPrimary} = true`),
    uniqueIndex("product_images_single_placement_idx")
      .on(table.productId, table.role)
      .where(sql`${table.role} in ('HERO_CUTOUT','HERO_BACKGROUND','HERO_BACKGROUND_MOBILE','FEATURED_BACKGROUND','FEATURED_BACKGROUND_MOBILE','INGREDIENT_SHOWCASE')`),
    index("product_images_product_sort_idx").on(table.productId, table.sortOrder),
  ],
);

export const productUsageSuggestions = pgTable(
  "product_usage_suggestions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    productImageId: uuid("product_image_id").notNull().unique().references(() => productImages.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    check("product_usage_suggestions_sort_nonnegative", sql`${table.sortOrder} >= 0`),
    uniqueIndex("product_usage_suggestions_active_sort_idx").on(table.productId, table.sortOrder).where(sql`${table.active} = true`),
    index("product_usage_suggestions_product_active_idx").on(table.productId, table.active, table.sortOrder),
  ],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull().unique(),
    weightGrams: integer("weight_grams").notNull(),
    price: bigint("price", { mode: "number" }).notNull(),
    originalPrice: bigint("original_price", { mode: "number" }),
    stock: integer("stock").notNull().default(0),
    version: integer("version").notNull().default(1),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    unique("product_variants_product_weight_unique").on(table.productId, table.weightGrams),
    check("product_variants_weight_positive", sql`${table.weightGrams} > 0`),
    check("product_variants_price_range", sql`${table.price} between 0 and 1000000000`),
    check("product_variants_original_price", sql`${table.originalPrice} is null or ${table.originalPrice} >= ${table.price}`),
    check("product_variants_stock_nonnegative", sql`${table.stock} >= 0`),
    check("product_variants_version_positive", sql`${table.version} > 0`),
    check("product_variants_sku_normalized", sql`${table.sku} = upper(btrim(${table.sku}))`),
    index("product_variants_product_active_idx").on(table.productId, table.active),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderCode: text("order_code").notNull().unique(),
    idempotencyKeyHash: text("idempotency_key_hash").notNull().unique(),
    requestFingerprint: text("request_fingerprint"),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    phoneNormalized: text("phone_normalized").notNull(),
    email: text("email"),
    provinceCode: text("province_code").notNull(),
    provinceName: text("province_name").notNull(),
    wardCode: text("ward_code").notNull(),
    wardName: text("ward_name").notNull(),
    legacyDistrictName: text("legacy_district_name"),
    addressLine: text("address_line").notNull(),
    addressDataVersion: text("address_data_version").notNull(),
    note: text("note"),
    subtotal: bigint("subtotal", { mode: "number" }).notNull(),
    shippingFee: bigint("shipping_fee", { mode: "number" }).notNull(),
    total: bigint("total", { mode: "number" }).notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull().default("COD"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("UNPAID"),
    paymentProviderTransactionId: text("payment_provider_transaction_id"),
    paidAt: timestamp("paid_at", { withTimezone: true, mode: "date" }),
    status: orderStatusEnum("status").notNull().default("PENDING"),
    finalizedAt: timestamp("finalized_at", { withTimezone: true, mode: "date" }),
    reservationExpiresAt: timestamp("reservation_expires_at", { withTimezone: true, mode: "date" }).notNull(),
    inventoryRestoredAt: timestamp("inventory_restored_at", { withTimezone: true, mode: "date" }),
    returnDisposition: returnDispositionEnum("return_disposition"),
    ...timestamps,
  },
  (table) => [
    check("orders_subtotal_range", sql`${table.subtotal} between 0 and 1000000000`),
    check("orders_shipping_fee_range", sql`${table.shippingFee} between 0 and 1000000000`),
    check("orders_total_valid", sql`${table.total} = ${table.subtotal} + ${table.shippingFee} and ${table.total} <= 1000000000`),
    index("orders_status_created_idx").on(table.status, table.createdAt),
    index("orders_phone_normalized_idx").on(table.phoneNormalized),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
    productVariantId: uuid("product_variant_id").notNull().references(() => productVariants.id, { onDelete: "restrict" }),
    productName: text("product_name").notNull(),
    productImageUrl: text("product_image_url"),
    variantSku: text("variant_sku").notNull(),
    weightLabel: text("weight_label").notNull(),
    unitPrice: bigint("unit_price", { mode: "number" }).notNull(),
    quantity: integer("quantity").notNull(),
    lineSubtotal: bigint("line_subtotal", { mode: "number" }).notNull(),
  },
  (table) => [
    unique("order_items_order_variant_unique").on(table.orderId, table.productVariantId),
    check("order_items_unit_price_range", sql`${table.unitPrice} between 0 and 1000000000`),
    check("order_items_quantity_range", sql`${table.quantity} between 1 and 99`),
    check("order_items_line_subtotal", sql`${table.lineSubtotal} = ${table.unitPrice} * ${table.quantity}`),
    index("order_items_order_idx").on(table.orderId),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    orderItemId: uuid("order_item_id").unique().references(() => orderItems.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    rating: smallint("rating").notNull(),
    content: text("content").notNull(),
    source: reviewSourceEnum("source").notNull(),
    sourceReference: text("source_reference"),
    approved: boolean("approved").notNull().default(false),
    approvedBy: uuid("approved_by").references(() => admins.id, { onDelete: "set null" }),
    approvedAt: timestamp("approved_at", { withTimezone: true, mode: "date" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    check("reviews_rating_range", sql`${table.rating} between 1 and 5`),
    check("reviews_source_reference", sql`(${table.source} <> 'VERIFIED' or ${table.orderItemId} is not null) and (${table.source} <> 'IMPORTED' or ${table.sourceReference} is not null)`),
    index("reviews_product_approved_idx").on(table.productId, table.approved),
  ],
);

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedBy: uuid("updated_by").references(() => admins.id, { onDelete: "set null" }),
  ...timestamps,
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: uuid("admin_id").references(() => admins.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "restrict" }),
    productVariantId: uuid("product_variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    fromStatus: orderStatusEnum("from_status"),
    toStatus: orderStatusEnum("to_status"),
    stockDelta: integer("stock_delta"),
    reason: text("reason"),
    requestId: text("request_id"),
    beforeData: jsonb("before_data"),
    afterData: jsonb("after_data"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("audit_logs_order_created_idx").on(table.orderId, table.createdAt), index("audit_logs_entity_idx").on(table.entityType, table.entityId)],
);

export const rateLimitBuckets = pgTable(
  "rate_limit_buckets",
  {
    keyHash: text("key_hash").notNull(),
    action: text("action").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true, mode: "date" }).notNull(),
    count: integer("count").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.keyHash, table.action, table.windowStart], name: "rate_limit_buckets_pk" }),
    check("rate_limit_buckets_count_positive", sql`${table.count} > 0`),
    index("rate_limit_buckets_expires_idx").on(table.expiresAt),
  ],
);

export const blobCleanupJobs = pgTable(
  "blob_cleanup_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pathname: text("pathname").notNull().unique(),
    reason: text("reason").notNull(),
    status: blobCleanupStatusEnum("status").notNull().default("PENDING"),
    attempts: integer("attempts").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    lastErrorCode: text("last_error_code"),
    ...timestamps,
  },
  (table) => [
    check("blob_cleanup_jobs_attempts_nonnegative", sql`${table.attempts} >= 0`),
    index("blob_cleanup_jobs_status_next_idx").on(table.status, table.nextAttemptAt),
  ],
);

export const databaseEnvironmentGuards = pgTable(
  "database_environment_guards",
  {
    singleton: boolean("singleton").primaryKey().notNull().default(true),
    environment: databaseEnvironmentEnum("environment").notNull(),
    instanceId: uuid("instance_id").notNull().unique(),
    ...timestamps,
  },
  (table) => [check("database_environment_guards_singleton", sql`${table.singleton} = true`)],
);

export type OrderRecord = typeof orders.$inferSelect;
export type OrderItemRecord = typeof orderItems.$inferSelect;
export type ProductRecord = typeof products.$inferSelect;
export type ProductVariantRecord = typeof productVariants.$inferSelect;
