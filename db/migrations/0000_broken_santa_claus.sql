CREATE TYPE "public"."admin_role" AS ENUM('OWNER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."blob_cleanup_status" AS ENUM('PENDING', 'PROCESSING', 'DONE', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."database_environment" AS ENUM('DEVELOPMENT', 'TEST', 'PREVIEW', 'PRODUCTION');--> statement-breakpoint
CREATE TYPE "public"."image_storage_provider" AS ENUM('LOCAL', 'VERCEL_BLOB');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERY_FAILED', 'RETURNED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('COD');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('UNPAID', 'PAID', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."product_image_role" AS ENUM('GALLERY', 'HERO_CUTOUT', 'HERO_BACKGROUND', 'HERO_BACKGROUND_MOBILE', 'FEATURED_BACKGROUND', 'FEATURED_BACKGROUND_MOBILE', 'INGREDIENT_SHOWCASE', 'USAGE');--> statement-breakpoint
CREATE TYPE "public"."return_disposition" AS ENUM('RESTOCKED', 'DISCARDED');--> statement-breakpoint
CREATE TYPE "public"."review_source" AS ENUM('VERIFIED', 'IMPORTED', 'DEMO');--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "admin_role" DEFAULT 'ADMIN' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"password_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email"),
	CONSTRAINT "admins_email_normalized" CHECK ("admins"."email" = lower(btrim("admins"."email"))),
	CONSTRAINT "admins_display_name_not_blank" CHECK (length(btrim("admins"."display_name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"order_id" uuid,
	"product_variant_id" uuid,
	"from_status" "order_status",
	"to_status" "order_status",
	"stock_delta" integer,
	"reason" text,
	"request_id" text,
	"before_data" jsonb,
	"after_data" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blob_cleanup_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pathname" text NOT NULL,
	"reason" text NOT NULL,
	"status" "blob_cleanup_status" DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blob_cleanup_jobs_pathname_unique" UNIQUE("pathname"),
	CONSTRAINT "blob_cleanup_jobs_attempts_nonnegative" CHECK ("blob_cleanup_jobs"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"image_url" text,
	"image_storage_provider" "image_storage_provider",
	"image_blob_pathname" text,
	"image_alt" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug"),
	CONSTRAINT "categories_image_blob_pathname_unique" UNIQUE("image_blob_pathname"),
	CONSTRAINT "categories_sort_order_nonnegative" CHECK ("categories"."sort_order" >= 0),
	CONSTRAINT "categories_slug_format" CHECK ("categories"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "categories_asset_shape" CHECK (("categories"."image_storage_provider" is null and "categories"."image_url" is null and "categories"."image_blob_pathname" is null)
          or ("categories"."image_storage_provider" = 'LOCAL' and "categories"."image_url" like '/%' and "categories"."image_blob_pathname" is null)
          or ("categories"."image_storage_provider" = 'VERCEL_BLOB' and "categories"."image_url" is not null and "categories"."image_blob_pathname" is not null))
);
--> statement-breakpoint
CREATE TABLE "database_environment_guards" (
	"singleton" boolean PRIMARY KEY DEFAULT true NOT NULL,
	"environment" "database_environment" NOT NULL,
	"instance_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "database_environment_guards_instance_id_unique" UNIQUE("instance_id"),
	CONSTRAINT "database_environment_guards_singleton" CHECK ("database_environment_guards"."singleton" = true)
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_variant_id" uuid NOT NULL,
	"product_name" text NOT NULL,
	"product_image_url" text,
	"variant_sku" text NOT NULL,
	"weight_label" text NOT NULL,
	"unit_price" bigint NOT NULL,
	"quantity" integer NOT NULL,
	"line_subtotal" bigint NOT NULL,
	CONSTRAINT "order_items_order_variant_unique" UNIQUE("order_id","product_variant_id"),
	CONSTRAINT "order_items_unit_price_range" CHECK ("order_items"."unit_price" between 0 and 1000000000),
	CONSTRAINT "order_items_quantity_range" CHECK ("order_items"."quantity" between 1 and 99),
	CONSTRAINT "order_items_line_subtotal" CHECK ("order_items"."line_subtotal" = "order_items"."unit_price" * "order_items"."quantity")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_code" text NOT NULL,
	"idempotency_key_hash" text NOT NULL,
	"request_fingerprint" text,
	"customer_name" text NOT NULL,
	"phone" text NOT NULL,
	"phone_normalized" text NOT NULL,
	"email" text,
	"province_code" text NOT NULL,
	"province_name" text NOT NULL,
	"ward_code" text NOT NULL,
	"ward_name" text NOT NULL,
	"legacy_district_name" text,
	"address_line" text NOT NULL,
	"address_data_version" text NOT NULL,
	"note" text,
	"subtotal" bigint NOT NULL,
	"shipping_fee" bigint NOT NULL,
	"total" bigint NOT NULL,
	"payment_method" "payment_method" DEFAULT 'COD' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'UNPAID' NOT NULL,
	"payment_provider_transaction_id" text,
	"paid_at" timestamp with time zone,
	"status" "order_status" DEFAULT 'PENDING' NOT NULL,
	"finalized_at" timestamp with time zone,
	"reservation_expires_at" timestamp with time zone NOT NULL,
	"inventory_restored_at" timestamp with time zone,
	"return_disposition" "return_disposition",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_code_unique" UNIQUE("order_code"),
	CONSTRAINT "orders_idempotency_key_hash_unique" UNIQUE("idempotency_key_hash"),
	CONSTRAINT "orders_subtotal_range" CHECK ("orders"."subtotal" between 0 and 1000000000),
	CONSTRAINT "orders_shipping_fee_range" CHECK ("orders"."shipping_fee" between 0 and 1000000000),
	CONSTRAINT "orders_total_valid" CHECK ("orders"."total" = "orders"."subtotal" + "orders"."shipping_fee" and "orders"."total" <= 1000000000)
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"url" text NOT NULL,
	"storage_provider" "image_storage_provider" NOT NULL,
	"blob_pathname" text,
	"role" "product_image_role" DEFAULT 'GALLERY' NOT NULL,
	"alt" text NOT NULL,
	"focal_x" smallint DEFAULT 50 NOT NULL,
	"focal_y" smallint DEFAULT 50 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_images_blob_pathname_unique" UNIQUE("blob_pathname"),
	CONSTRAINT "product_images_focal_x_range" CHECK ("product_images"."focal_x" between 0 and 100),
	CONSTRAINT "product_images_focal_y_range" CHECK ("product_images"."focal_y" between 0 and 100),
	CONSTRAINT "product_images_sort_order_nonnegative" CHECK ("product_images"."sort_order" >= 0),
	CONSTRAINT "product_images_asset_shape" CHECK (("product_images"."storage_provider" = 'LOCAL' and "product_images"."url" like '/%' and "product_images"."blob_pathname" is null)
          or ("product_images"."storage_provider" = 'VERCEL_BLOB' and "product_images"."url" like 'https://%' and "product_images"."blob_pathname" is not null)),
	CONSTRAINT "product_images_primary_role" CHECK (not "product_images"."is_primary" or "product_images"."role" in ('GALLERY', 'HERO_CUTOUT'))
);
--> statement-breakpoint
CREATE TABLE "product_usage_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"product_image_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_usage_suggestions_product_image_id_unique" UNIQUE("product_image_id"),
	CONSTRAINT "product_usage_suggestions_sort_nonnegative" CHECK ("product_usage_suggestions"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"weight_grams" integer NOT NULL,
	"price" bigint NOT NULL,
	"original_price" bigint,
	"stock" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_variants_sku_unique" UNIQUE("sku"),
	CONSTRAINT "product_variants_product_weight_unique" UNIQUE("product_id","weight_grams"),
	CONSTRAINT "product_variants_weight_positive" CHECK ("product_variants"."weight_grams" > 0),
	CONSTRAINT "product_variants_price_range" CHECK ("product_variants"."price" between 0 and 1000000000),
	CONSTRAINT "product_variants_original_price" CHECK ("product_variants"."original_price" is null or "product_variants"."original_price" >= "product_variants"."price"),
	CONSTRAINT "product_variants_stock_nonnegative" CHECK ("product_variants"."stock" >= 0),
	CONSTRAINT "product_variants_version_positive" CHECK ("product_variants"."version" > 0),
	CONSTRAINT "product_variants_sku_normalized" CHECK ("product_variants"."sku" = upper(btrim("product_variants"."sku")))
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"short_description" text NOT NULL,
	"ingredients" text,
	"usage" text,
	"storage_instructions" text,
	"origin" text,
	"manufacturer" text,
	"distributor" text,
	"shelf_life" text,
	"allergen_warning" text,
	"nutrition_info" text,
	"best_seller" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "products_slug_format" CHECK ("products"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "rate_limit_buckets" (
	"key_hash" text NOT NULL,
	"action" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "rate_limit_buckets_pk" PRIMARY KEY("key_hash","action","window_start"),
	CONSTRAINT "rate_limit_buckets_count_positive" CHECK ("rate_limit_buckets"."count" > 0)
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"order_item_id" uuid,
	"customer_name" text NOT NULL,
	"rating" smallint NOT NULL,
	"content" text NOT NULL,
	"source" "review_source" NOT NULL,
	"source_reference" text,
	"approved" boolean DEFAULT false NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_order_item_id_unique" UNIQUE("order_item_id"),
	CONSTRAINT "reviews_rating_range" CHECK ("reviews"."rating" between 1 and 5),
	CONSTRAINT "reviews_source_reference" CHECK (("reviews"."source" <> 'VERIFIED' or "reviews"."order_item_id" is not null) and ("reviews"."source" <> 'IMPORTED' or "reviews"."source_reference" is not null))
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_product_variant_id_product_variants_id_fk" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_variant_id_product_variants_id_fk" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_usage_suggestions" ADD CONSTRAINT "product_usage_suggestions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_usage_suggestions" ADD CONSTRAINT "product_usage_suggestions_product_image_id_product_images_id_fk" FOREIGN KEY ("product_image_id") REFERENCES "public"."product_images"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_approved_by_admins_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_updated_by_admins_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_sessions_admin_expires_idx" ON "admin_sessions" USING btree ("admin_id","expires_at");--> statement-breakpoint
CREATE INDEX "admin_sessions_expires_idx" ON "admin_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "audit_logs_order_created_idx" ON "audit_logs" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "blob_cleanup_jobs_status_next_idx" ON "blob_cleanup_jobs" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "categories_active_sort_idx" ON "categories" USING btree ("active","sort_order");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_status_created_idx" ON "orders" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "orders_phone_normalized_idx" ON "orders" USING btree ("phone_normalized");--> statement-breakpoint
CREATE UNIQUE INDEX "product_images_one_primary_idx" ON "product_images" USING btree ("product_id") WHERE "product_images"."is_primary" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "product_images_single_placement_idx" ON "product_images" USING btree ("product_id","role") WHERE "product_images"."role" in ('HERO_CUTOUT','HERO_BACKGROUND','HERO_BACKGROUND_MOBILE','FEATURED_BACKGROUND','FEATURED_BACKGROUND_MOBILE','INGREDIENT_SHOWCASE');--> statement-breakpoint
CREATE INDEX "product_images_product_sort_idx" ON "product_images" USING btree ("product_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "product_usage_suggestions_active_sort_idx" ON "product_usage_suggestions" USING btree ("product_id","sort_order") WHERE "product_usage_suggestions"."active" = true;--> statement-breakpoint
CREATE INDEX "product_usage_suggestions_product_active_idx" ON "product_usage_suggestions" USING btree ("product_id","active","sort_order");--> statement-breakpoint
CREATE INDEX "product_variants_product_active_idx" ON "product_variants" USING btree ("product_id","active");--> statement-breakpoint
CREATE INDEX "products_category_active_idx" ON "products" USING btree ("category_id","active");--> statement-breakpoint
CREATE INDEX "products_active_bestseller_idx" ON "products" USING btree ("active","best_seller");--> statement-breakpoint
CREATE INDEX "rate_limit_buckets_expires_idx" ON "rate_limit_buckets" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "reviews_product_approved_idx" ON "reviews" USING btree ("product_id","approved");