import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { and, asc, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import sharp from "sharp";
import { z } from "zod";

import { type Database, getDatabase } from "@/db/client";
import {
  auditLogs,
  blobCleanupJobs,
  categories,
  orderItems,
  orders,
  productImages,
  products,
  productUsageSuggestions,
  productVariants,
  reviews,
  siteSettings,
} from "@/db/schema";
import { parseSetting, type SettingKey } from "@/lib/validation/settings";

import { mutateCatalogDocument, readCatalogDocument, type CatalogProductRecord } from "./catalog-store";
import { advisoryLockKey, sha256 } from "./crypto";
import { getDeploymentMode, usesJsonCatalogBackend } from "./env";
import { AppError } from "./errors";
import { deleteUnreferencedCatalogBlobImages } from "./uploads";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type OrderStatus = typeof orders.$inferSelect.status;

function invalidateCatalog(options: { products?: boolean; categories?: boolean } = { products: true }) {
  if (options.products) revalidateTag("products", "max");
  if (options.categories) revalidateTag("categories", "max");
  revalidatePath("/");
}

function validBlobReference(url: string | null | undefined, pathname: string | null | undefined): boolean {
  if (!url || !pathname?.startsWith("moon-spice/")) return false;
  try {
    const parsed = new URL(url);
    const tokenParts = process.env.BLOB_READ_WRITE_TOKEN?.split("_") ?? [];
    const storeId = tokenParts[0] === "vercel" && tokenParts[1] === "blob" && tokenParts[2] === "rw" ? tokenParts[3] : undefined;
    if (!storeId || !/^[a-zA-Z0-9]+$/.test(storeId)) return false;
    return parsed.protocol === "https:"
      && parsed.hostname === `${storeId}.public.blob.vercel-storage.com`
      && parsed.pathname.replace(/^\//, "") === pathname;
  } catch {
    return false;
  }
}

function nextIsoTimestamp(previous?: string): string {
  const now = Date.now();
  if (!previous) return new Date(now).toISOString();
  const previousTime = Date.parse(previous);
  return new Date(Number.isFinite(previousTime) ? Math.max(now, previousTime + 1) : now).toISOString();
}

function blobPathnameFromOwnedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const pathname = new URL(url).pathname.replace(/^\//, "");
    return validBlobReference(url, pathname) ? pathname : null;
  } catch {
    return null;
  }
}

async function cleanupRemovedJsonBlobs(pathnames: readonly string[]): Promise<void> {
  if (pathnames.length === 0 || (process.env.STORAGE_ADAPTER ?? "local") !== "vercel-blob") return;
  try {
    await deleteUnreferencedCatalogBlobImages(pathnames);
  } catch {
    // The catalog commit is authoritative. A failed best-effort cleanup must
    // never make an administrator retry an already-applied full-form write.
  }
}

const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["SHIPPING", "CANCELLED"],
  SHIPPING: ["COMPLETED", "DELIVERY_FAILED"],
  DELIVERY_FAILED: ["SHIPPING", "RETURNED"],
  RETURNED: [],
  COMPLETED: [],
  CANCELLED: [],
};

async function restoreOrderStock(tx: Transaction, orderId: string, adminId: string, reason: string | undefined, requestId: string | undefined): Promise<void> {
  const items = await tx
    .select({ variantId: orderItems.productVariantId, quantity: orderItems.quantity })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))
    .orderBy(orderItems.productVariantId);
  for (const item of items) {
    await tx
      .update(productVariants)
      .set({ stock: sql`${productVariants.stock} + ${item.quantity}`, version: sql`${productVariants.version} + 1`, updatedAt: new Date() })
      .where(eq(productVariants.id, item.variantId));
    await tx.insert(auditLogs).values({
      adminId,
      action: "INVENTORY_RESTORED",
      entityType: "ProductVariant",
      entityId: item.variantId,
      orderId,
      productVariantId: item.variantId,
      stockDelta: item.quantity,
      reason,
      requestId,
    });
  }
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
  expectedStatus: OrderStatus;
  reason?: string;
  requestId?: string;
  adminId: string;
  paymentReceived?: boolean;
  returnDisposition?: "RESTOCKED" | "DISCARDED";
}

export async function updateOrderStatus(orderId: string, input: UpdateOrderStatusInput) {
  return getDatabase().transaction(async (tx) => {
    const [current] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update").limit(1);
    if (!current) throw new AppError(404, "ORDER_NOT_FOUND", "Không tìm thấy đơn hàng");
    if (current.status !== input.expectedStatus) {
      throw new AppError(409, "INVALID_ORDER_TRANSITION", "Trạng thái đơn hàng vừa thay đổi", { currentStatus: current.status });
    }
    if (!transitions[current.status].includes(input.status)) {
      throw new AppError(409, "INVALID_ORDER_TRANSITION", "Không thể chuyển sang trạng thái đã chọn", { currentStatus: current.status });
    }
    const reason = input.reason?.trim() || undefined;
    if (input.status === "DELIVERY_FAILED" && !reason) {
      throw new AppError(400, "REASON_REQUIRED", "Cần nhập lý do giao hàng thất bại");
    }
    if (input.status === "COMPLETED" && input.paymentReceived !== true) {
      throw new AppError(400, "PAYMENT_CONFIRMATION_REQUIRED", "Cần xác nhận đã thu tiền COD");
    }
    if (input.status === "RETURNED" && !input.returnDisposition) {
      throw new AppError(400, "RETURN_DISPOSITION_REQUIRED", "Cần chọn cách xử lý hàng hoàn");
    }

    const now = new Date();
    const terminal = (["COMPLETED", "CANCELLED", "RETURNED"] as const).includes(input.status as "COMPLETED" | "CANCELLED" | "RETURNED");
    let inventoryRestoredAt = current.inventoryRestoredAt;
    if ((input.status === "CANCELLED" || (input.status === "RETURNED" && input.returnDisposition === "RESTOCKED")) && !inventoryRestoredAt) {
      await restoreOrderStock(tx, current.id, input.adminId, reason, input.requestId);
      inventoryRestoredAt = now;
    }
    const paymentStatus = input.status === "COMPLETED"
      ? "PAID" as const
      : input.status === "DELIVERY_FAILED"
        ? "FAILED" as const
        : input.status === "SHIPPING" && current.status === "DELIVERY_FAILED"
          ? "UNPAID" as const
          : current.paymentStatus;
    const [updated] = await tx
      .update(orders)
      .set({
        status: input.status,
        paymentStatus,
        paidAt: input.status === "COMPLETED" ? now : paymentStatus === "UNPAID" || paymentStatus === "FAILED" ? null : current.paidAt,
        finalizedAt: terminal ? now : null,
        inventoryRestoredAt,
        returnDisposition: input.status === "RETURNED" ? input.returnDisposition : current.returnDisposition,
        updatedAt: now,
      })
      .where(and(eq(orders.id, current.id), eq(orders.status, current.status)))
      .returning();
    if (!updated) throw new AppError(409, "INVALID_ORDER_TRANSITION", "Trạng thái đơn hàng vừa thay đổi");
    await tx.insert(auditLogs).values({
      adminId: input.adminId,
      action: "ORDER_STATUS_CHANGED",
      entityType: "Order",
      entityId: current.id,
      orderId: current.id,
      fromStatus: current.status,
      toStatus: updated.status,
      reason,
      requestId: input.requestId,
      beforeData: { status: current.status, paymentStatus: current.paymentStatus },
      afterData: { status: updated.status, paymentStatus: updated.paymentStatus, returnDisposition: updated.returnDisposition },
    });
    return updated;
  });
}

function normalizePagination(input: { page?: number; pageSize?: number }) {
  const page = Math.max(1, Math.trunc(input.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.trunc(input.pageSize ?? 20)));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export async function getAdminDashboard() {
  if (usesJsonCatalogBackend()) {
    const document = await readCatalogDocument({ fresh: true });
    return {
      metrics: { orderCount: 0, revenue: 0, productCount: document.products.length, pendingCount: 0 },
      recentOrders: [],
    };
  }
  const db = getDatabase();
  const [metrics, recentOrders] = await Promise.all([
    db.execute<{ order_count: string; revenue: string; product_count: string; pending_count: string }>(sql`
      select
        count(*)::text as order_count,
        coalesce(sum(total) filter (where status = 'COMPLETED'), 0)::text as revenue,
        (select count(*) from products)::text as product_count,
        count(*) filter (where status = 'PENDING')::text as pending_count
      from orders
    `),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(10),
  ]);
  const row = metrics.rows[0];
  return {
    metrics: {
      orderCount: Number(row?.order_count ?? 0),
      revenue: Number(row?.revenue ?? 0),
      productCount: Number(row?.product_count ?? 0),
      pendingCount: Number(row?.pending_count ?? 0),
    },
    recentOrders,
  };
}

export async function listAdminProducts(input: { page?: number; pageSize?: number; search?: string } = {}) {
  if (usesJsonCatalogBackend()) {
    const { page, pageSize, offset } = normalizePagination(input);
    const search = input.search?.trim().toLocaleLowerCase("vi") ?? "";
    const document = await readCatalogDocument({ fresh: true });
    const items = document.products
      .filter((product) => !search || `${product.name} ${product.slug}`.toLocaleLowerCase("vi").includes(search))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    return { items: items.slice(offset, offset + pageSize), page, pageSize, total: items.length };
  }
  const { page, pageSize, offset } = normalizePagination(input);
  const where = input.search?.trim() ? ilike(products.name, `%${input.search.trim()}%`) : undefined;
  const db = getDatabase();
  const [rows, countRows] = await Promise.all([
    db.select().from(products).where(where).orderBy(desc(products.updatedAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(products).where(where),
  ]);
  return { items: rows, page, pageSize, total: Number(countRows[0]?.count ?? 0) };
}

export async function getAdminProduct(id: string) {
  if (usesJsonCatalogBackend()) {
    const document = await readCatalogDocument({ fresh: true });
    const product = document.products.find((item) => item.id === id);
    if (!product) return null;
    return {
      product,
      variants: document.productVariants.filter((item) => item.productId === id).sort((a, b) => a.weightGrams - b.weightGrams),
      images: document.productImages.filter((item) => item.productId === id).sort((a, b) => a.sortOrder - b.sortOrder),
      suggestions: document.usageSuggestions.filter((item) => item.productId === id).sort((a, b) => a.sortOrder - b.sortOrder),
    };
  }
  const db = getDatabase();
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) return null;
  const [variants, images, suggestions] = await Promise.all([
    db.select().from(productVariants).where(eq(productVariants.productId, id)).orderBy(asc(productVariants.weightGrams)),
    db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(asc(productImages.sortOrder)),
    db.select().from(productUsageSuggestions).where(eq(productUsageSuggestions.productId, id)).orderBy(asc(productUsageSuggestions.sortOrder)),
  ]);
  return { product, variants, images, suggestions };
}

export async function listAdminCategories() {
  if (usesJsonCatalogBackend()) {
    return (await readCatalogDocument({ fresh: true })).categories.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }
  return getDatabase().select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function listAdminOrders(input: { page?: number; pageSize?: number; status?: OrderStatus; search?: string } = {}) {
  if (usesJsonCatalogBackend()) {
    const { page, pageSize } = normalizePagination(input);
    return { items: [], page, pageSize, total: 0 };
  }
  const { page, pageSize, offset } = normalizePagination(input);
  const filters = [input.status ? eq(orders.status, input.status) : undefined, input.search?.trim() ? ilike(orders.orderCode, `%${input.search.trim()}%`) : undefined].filter(Boolean);
  const where = filters.length ? and(...filters) : undefined;
  const db = getDatabase();
  const [rows, countRows] = await Promise.all([
    db.select().from(orders).where(where).orderBy(desc(orders.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(orders).where(where),
  ]);
  return { items: rows, page, pageSize, total: Number(countRows[0]?.count ?? 0) };
}

export async function getAdminOrder(id: string) {
  if (usesJsonCatalogBackend()) return null;
  const db = getDatabase();
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id)).orderBy(orderItems.id);
  return { order, items };
}

export async function listAdminReviews(input: { page?: number; pageSize?: number; approved?: boolean } = {}) {
  if (usesJsonCatalogBackend()) {
    const { page, pageSize } = normalizePagination(input);
    return { items: [], page, pageSize, total: 0 };
  }
  const { page, pageSize, offset } = normalizePagination(input);
  const where = input.approved === undefined ? undefined : eq(reviews.approved, input.approved);
  const db = getDatabase();
  const [rows, countRows] = await Promise.all([
    db.select().from(reviews).where(where).orderBy(desc(reviews.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(reviews).where(where),
  ]);
  return { items: rows, page, pageSize, total: Number(countRows[0]?.count ?? 0) };
}

export async function listAdminCustomers(input: { page?: number; pageSize?: number; search?: string } = {}) {
  if (usesJsonCatalogBackend()) {
    const { page, pageSize } = normalizePagination(input);
    return { items: [], page, pageSize };
  }
  const { page, pageSize, offset } = normalizePagination(input);
  const search = input.search?.trim();
  const result = await getDatabase().execute<{
    phone_normalized: string;
    customer_name: string;
    phone: string;
    email: string | null;
    order_count: number;
    total_spent: string;
    last_order_at: Date;
  }>(sql`
    select
      phone_normalized,
      (array_agg(customer_name order by created_at desc))[1] as customer_name,
      (array_agg(phone order by created_at desc))[1] as phone,
      (array_agg(email order by created_at desc))[1] as email,
      count(*)::int as order_count,
      coalesce(sum(total) filter (where status = 'COMPLETED'), 0)::text as total_spent,
      max(created_at) as last_order_at
    from orders
    where phone_normalized <> 'REDACTED'
      ${search ? sql`and (phone_normalized ilike ${`%${search}%`} or customer_name ilike ${`%${search}%`})` : sql``}
    group by phone_normalized
    order by max(created_at) desc
    limit ${pageSize} offset ${offset}
  `);
  return { items: result.rows.map((row) => ({ ...row, total_spent: Number(row.total_spent) })), page, pageSize };
}

export async function listAdminSettings() {
  if (usesJsonCatalogBackend()) return (await readCatalogDocument({ fresh: true })).settings;
  return getDatabase().select().from(siteSettings).orderBy(siteSettings.key);
}

const requiredSettingKeys = [
  "hero_product_id",
  "featured_product_id",
  "homepage_best_seller_limit",
  "free_shipping_threshold",
  "default_shipping_fee",
  "pending_order_expiry_hours",
  "order_pii_retention_days",
  "order_asset_retention_days",
  "announcement_text",
  "store_contact",
] as const satisfies readonly SettingKey[];

export async function updateSiteSettings(entries: readonly (readonly [SettingKey, unknown])[], adminId: string, requestId?: string, expectedRevision?: number) {
  const supplied = new Map<SettingKey, unknown>();
  for (const [key, value] of entries) {
    if (supplied.has(key)) throw new AppError(400, "DUPLICATE_SETTING", `Cài đặt ${key} bị lặp`);
    supplied.set(key, parseSetting(key, value));
  }
  if (requiredSettingKeys.some((key) => !supplied.has(key)) || supplied.size !== requiredSettingKeys.length) {
    throw new AppError(400, "INCOMPLETE_SETTINGS", "Payload cài đặt không đầy đủ");
  }
  const heroProductId = supplied.get("hero_product_id") as string | null;
  const featuredProductId = supplied.get("featured_product_id") as string | null;
  const homepageProductIds = [...new Set([heroProductId, featuredProductId].filter((value): value is string => Boolean(value)))];

  if (usesJsonCatalogBackend()) {
    const { document } = await mutateCatalogDocument((draft) => {
      if (draft.revision !== expectedRevision) {
        throw new AppError(409, "STALE_CATALOG_WRITE", "Cài đặt đã được thay đổi. Hãy tải lại trang trước khi lưu tiếp.", { currentRevision: draft.revision });
      }
      const eligible = (productId: string) => {
        const product = draft.products.find((item) => item.id === productId);
        return Boolean(product
          && product.active
          && draft.categories.some((category) => category.id === product.categoryId && category.active)
          && draft.productVariants.some((variant) => variant.productId === product.id && variant.active)
          && draft.productImages.filter((image) => image.productId === product.id && image.isPrimary).length === 1);
      };
      if (!homepageProductIds.every(eligible)) {
        throw new AppError(400, "INELIGIBLE_HOMEPAGE_PRODUCT", "Sản phẩm trang chủ phải đang hoạt động, thuộc danh mục đang bật, có biến thể hoạt động và đúng một ảnh chính");
      }
      draft.settings = {
        heroProductId,
        featuredProductId,
        homepageBestSellerLimit: Number(supplied.get("homepage_best_seller_limit")),
        freeShippingThreshold: Number(supplied.get("free_shipping_threshold")),
        defaultShippingFee: Number(supplied.get("default_shipping_fee")),
        pendingOrderExpiryHours: Number(supplied.get("pending_order_expiry_hours")),
        orderPiiRetentionDays: Number(supplied.get("order_pii_retention_days")),
        orderAssetRetentionDays: Number(supplied.get("order_asset_retention_days")),
        announcementText: String(supplied.get("announcement_text")),
        storeContact: supplied.get("store_contact") as typeof draft.settings.storeContact,
      };
    });
    invalidateCatalog({ products: true, categories: true });
    return document.settings;
  }

  const db = getDatabase();
  const result = await db.transaction(async (tx) => {
    const eligibleHomepageProducts = await tx
      .select({ id: products.id })
      .from(products)
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .where(and(
        inArray(products.id, homepageProductIds),
        eq(products.active, true),
        eq(categories.active, true),
        sql`exists (select 1 from ${productVariants} pv where pv.product_id = ${products.id} and pv.active = true)`,
        sql`(select count(*) from ${productImages} pi where pi.product_id = ${products.id} and pi.is_primary = true) = 1`,
      ))
      .for("share");
    if (eligibleHomepageProducts.length !== homepageProductIds.length) {
      throw new AppError(400, "INELIGIBLE_HOMEPAGE_PRODUCT", "Sản phẩm trang chủ phải đang hoạt động, thuộc danh mục đang bật, có biến thể hoạt động và đúng một ảnh chính");
    }

    const beforeRows = await tx
      .select()
      .from(siteSettings)
      .where(inArray(siteSettings.key, [...requiredSettingKeys]))
      .for("update");
    const beforeByKey = new Map(beforeRows.map((row) => [row.key, row]));
    const updated = [];
    for (const key of requiredSettingKeys) {
      const value = supplied.get(key)!;
      const [row] = await tx
        .insert(siteSettings)
        .values({ key, value, updatedBy: adminId })
        .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedBy: adminId, updatedAt: new Date() } })
        .returning();
      updated.push(row);
      const before = beforeByKey.get(key);
      await tx.insert(auditLogs).values({
        adminId,
        action: "SITE_SETTING_UPDATED",
        entityType: "SiteSetting",
        entityId: null,
        requestId,
        metadata: { settingKey: key },
        beforeData: before ? { key, value: before.value } : null,
        afterData: { key, value },
      });
    }
    return updated;
  });
  revalidateTag("site-settings", "max");
  revalidatePath("/");
  return result;
}

export async function updateInventory(input: { variantId: string; delta: number; expectedVersion: number; reason: string; adminId: string; requestId?: string }) {
  if (usesJsonCatalogBackend()) {
    if (!Number.isInteger(input.delta) || input.delta === 0 || Math.abs(input.delta) > 1_000_000) {
      throw new AppError(400, "VALIDATION_ERROR", "Mức điều chỉnh tồn kho phải là số nguyên khác 0");
    }
    if (!input.reason.trim()) throw new AppError(400, "REASON_REQUIRED", "Cần nhập lý do điều chỉnh tồn kho");
    const { result } = await mutateCatalogDocument((draft) => {
      const variant = draft.productVariants.find((item) => item.id === input.variantId);
      if (!variant || variant.version !== input.expectedVersion || variant.stock + input.delta < 0) {
        throw new AppError(409, "STALE_INVENTORY", "Tồn kho vừa được thay đổi; hãy tải lại dữ liệu mới nhất");
      }
      variant.stock += input.delta;
      variant.version += 1;
      variant.updatedAt = new Date().toISOString();
      return structuredClone(variant);
    });
    invalidateCatalog({ products: true });
    return result;
  }
  if (!Number.isInteger(input.delta) || input.delta === 0 || Math.abs(input.delta) > 10_000_000) throw new AppError(400, "VALIDATION_ERROR", "Mức điều chỉnh tồn kho phải là số nguyên khác 0");
  if (!input.reason.trim()) throw new AppError(400, "REASON_REQUIRED", "Cần nhập lý do điều chỉnh tồn kho");
  const db = getDatabase();
  const result = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(productVariants)
      .set({ stock: sql`${productVariants.stock} + ${input.delta}`, version: sql`${productVariants.version} + 1`, updatedAt: new Date() })
      .where(and(
        eq(productVariants.id, input.variantId),
        eq(productVariants.version, input.expectedVersion),
        sql`${productVariants.stock} + ${input.delta} >= 0`,
      ))
      .returning();
    if (!updated) throw new AppError(409, "STALE_INVENTORY", "Tồn kho vừa được thay đổi bởi thao tác khác");
    await tx.insert(auditLogs).values({
      adminId: input.adminId,
      action: "INVENTORY_ADJUSTED",
      entityType: "ProductVariant",
      entityId: input.variantId,
      productVariantId: input.variantId,
      stockDelta: input.delta,
      reason: input.reason.trim(),
      requestId: input.requestId,
      beforeData: { stock: updated.stock - input.delta, version: input.expectedVersion },
      afterData: { stock: updated.stock, version: updated.version },
    });
    return updated;
  });
  invalidateCatalog({ products: true });
  return result;
}

export async function setReviewApproval(input: { reviewId: string; approved: boolean; adminId: string; requestId?: string }) {
  if (usesJsonCatalogBackend()) {
    throw new AppError(403, "COMMERCE_UNAVAILABLE", "Catalog JSON không nhận hoặc duyệt đánh giá khách hàng");
  }
  const now = new Date();
  const updated = await getDatabase().transaction(async (tx) => {
    const [before] = await tx.select().from(reviews).where(eq(reviews.id, input.reviewId)).for("update").limit(1);
    if (!before) throw new AppError(404, "REVIEW_NOT_FOUND", "Không tìm thấy đánh giá");
    if (input.approved && before.source === "DEMO" && getDeploymentMode() === "production") {
      throw new AppError(400, "DEMO_REVIEW_FORBIDDEN", "Không thể hiển thị đánh giá demo ở Production");
    }
    const [saved] = await tx
      .update(reviews)
      .set({ approved: input.approved, approvedBy: input.approved ? input.adminId : null, approvedAt: input.approved ? now : null })
      .where(eq(reviews.id, input.reviewId))
      .returning();
    await tx.insert(auditLogs).values({
      adminId: input.adminId,
      action: input.approved ? "REVIEW_APPROVED" : "REVIEW_UNAPPROVED",
      entityType: "Review",
      entityId: input.reviewId,
      requestId: input.requestId,
      beforeData: { approved: before.approved },
      afterData: { approved: saved.approved },
    });
    return saved;
  });
  invalidateCatalog({ products: true });
  return updated;
}

const slugSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120);
const categoryMutationSchema = z.object({
  id: z.string().uuid().optional(),
  expectedUpdatedAt: z.string().datetime({ offset: true }).optional(),
  name: z.string().trim().min(2).max(100),
  slug: slugSchema,
  description: z.string().trim().max(1000).optional().nullable(),
  imageUrl: z.string().trim().max(2048).optional().nullable(),
  imageStorageProvider: z.enum(["LOCAL", "VERCEL_BLOB"]).optional().nullable(),
  imageBlobPathname: z.string().trim().max(1024).optional().nullable(),
  imageAlt: z.string().trim().max(200).optional().nullable(),
  sortOrder: z.number().int().min(0).max(10000).default(0),
  active: z.boolean().default(false),
}).strict();

export type CategoryMutationInput = z.input<typeof categoryMutationSchema>;

export async function saveCategory(rawInput: CategoryMutationInput, actor: { adminId: string; requestId?: string }) {
  const input = categoryMutationSchema.parse(rawInput);
  if (input.imageStorageProvider === "LOCAL" && (!input.imageUrl?.startsWith("/") || input.imageBlobPathname)) {
    throw new AppError(400, "INVALID_IMAGE_REFERENCE", "Ảnh local không được có Blob pathname");
  }
  if (input.imageStorageProvider === "VERCEL_BLOB" && !validBlobReference(input.imageUrl, input.imageBlobPathname)) {
    throw new AppError(400, "INVALID_IMAGE_REFERENCE", "Ảnh Blob cần URL và pathname hợp lệ");
  }
  if (input.imageUrl && !input.imageStorageProvider) {
    throw new AppError(400, "INVALID_IMAGE_REFERENCE", "Nguồn ảnh danh mục bị thiếu");
  }
  if (usesJsonCatalogBackend()) {
    if (input.active && (!input.imageUrl || !input.imageAlt)) {
      throw new AppError(400, "CATEGORY_IMAGE_REQUIRED", "Danh mục đang hoạt động cần có ảnh và mô tả ảnh");
    }
    const { result } = await mutateCatalogDocument((draft) => {
      const existing = input.id ? draft.categories.find((category) => category.id === input.id) : undefined;
      if (input.id && !existing) throw new AppError(404, "CATEGORY_NOT_FOUND", "Không tìm thấy danh mục");
      if (existing && existing.updatedAt !== input.expectedUpdatedAt) {
        throw new AppError(409, "STALE_CATALOG_WRITE", "Danh mục đã được thay đổi. Hãy tải lại trang trước khi lưu tiếp.", { currentUpdatedAt: existing.updatedAt });
      }
      if (existing && existing.slug !== input.slug) throw new AppError(409, "SLUG_IMMUTABLE", "Slug danh mục không thể thay đổi sau khi tạo");
      if (draft.categories.some((category) => category.slug === input.slug && category.id !== input.id)) throw new AppError(409, "CONFLICT", "Slug danh mục đã tồn tại");
      const now = nextIsoTimestamp(existing?.updatedAt);
      const saved = {
        id: existing?.id ?? input.id ?? randomUUID(), name: input.name, slug: input.slug,
        description: input.description ?? "", imageUrl: input.imageUrl ?? "", imageAlt: input.imageAlt ?? "",
        sortOrder: input.sortOrder, active: input.active, createdAt: existing?.createdAt ?? now, updatedAt: now,
      };
      const removedBlobPathname = existing && existing.imageUrl !== saved.imageUrl ? blobPathnameFromOwnedUrl(existing.imageUrl) : null;
      if (existing) draft.categories[draft.categories.indexOf(existing)] = saved;
      else draft.categories.push(saved);
      return { saved: structuredClone(saved), removedBlobPathname };
    });
    invalidateCatalog({ products: true, categories: true });
    await cleanupRemovedJsonBlobs(result.removedBlobPathname ? [result.removedBlobPathname] : []);
    return result.saved;
  }
  if (input.active && (!input.imageUrl || !input.imageStorageProvider || !input.imageAlt)) {
    throw new AppError(400, "CATEGORY_IMAGE_REQUIRED", "Danh mục đang hoạt động cần có ảnh và mô tả ảnh");
  }
  const result = await getDatabase().transaction(async (tx) => {
    if (input.imageStorageProvider === "VERCEL_BLOB" && input.imageBlobPathname) {
      await tx.execute(sql`select pg_advisory_xact_lock(${advisoryLockKey(sha256(`blob:${input.imageBlobPathname}`))})`);
      const [trackedUpload] = await tx.select({ id: blobCleanupJobs.id }).from(blobCleanupJobs).where(eq(blobCleanupJobs.pathname, input.imageBlobPathname)).limit(1);
      if (!trackedUpload) throw new AppError(400, "UNTRACKED_BLOB", "Ảnh Blob chưa được upload qua Moon Spice");
    }
    const existing = input.id
      ? (await tx.select().from(categories).where(eq(categories.id, input.id)).for("update").limit(1))[0]
      : undefined;
    if (input.id && !existing) throw new AppError(404, "CATEGORY_NOT_FOUND", "Không tìm thấy danh mục");
    if (existing && existing.slug !== input.slug) throw new AppError(409, "SLUG_IMMUTABLE", "Slug danh mục không thể thay đổi sau khi tạo");
    if (
      existing?.imageStorageProvider === "VERCEL_BLOB"
      && existing.imageBlobPathname
      && existing.imageBlobPathname !== input.imageBlobPathname
    ) {
      await tx.execute(sql`select pg_advisory_xact_lock(${advisoryLockKey(sha256(`blob:${existing.imageBlobPathname}`))})`);
      await tx
        .insert(blobCleanupJobs)
        .values({ pathname: existing.imageBlobPathname, reason: "CATEGORY_IMAGE_REPLACED" })
        .onConflictDoUpdate({
          target: blobCleanupJobs.pathname,
          set: { reason: "CATEGORY_IMAGE_REPLACED", status: "PENDING", attempts: 0, nextAttemptAt: new Date(), lastErrorCode: null, updatedAt: new Date() },
        });
    }
    const values = {
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      imageUrl: input.imageUrl || null,
      imageStorageProvider: input.imageStorageProvider || null,
      imageBlobPathname: input.imageBlobPathname || null,
      imageAlt: input.imageAlt || null,
      sortOrder: input.sortOrder,
      active: input.active,
      updatedAt: new Date(),
    };
    const [saved] = existing
      ? await tx.update(categories).set(values).where(eq(categories.id, existing.id)).returning()
      : await tx.insert(categories).values({ id: input.id ?? randomUUID(), ...values }).returning();
    if (saved.imageStorageProvider === "VERCEL_BLOB" && saved.imageBlobPathname) {
      await tx
        .update(blobCleanupJobs)
        .set({ status: "DONE", lastErrorCode: "ATTACHED_TO_CATALOG", updatedAt: new Date() })
        .where(eq(blobCleanupJobs.pathname, saved.imageBlobPathname));
    }
    await tx.insert(auditLogs).values({
      adminId: actor.adminId,
      action: existing ? "CATEGORY_UPDATED" : "CATEGORY_CREATED",
      entityType: "Category",
      entityId: saved.id,
      requestId: actor.requestId,
      beforeData: existing,
      afterData: saved,
    });
    return saved;
  });
  invalidateCatalog({ products: true, categories: true });
  return result;
}

export async function deactivateCategory(id: string, actor: { adminId: string; requestId?: string; expectedUpdatedAt?: string }) {
  if (usesJsonCatalogBackend()) {
    const { result } = await mutateCatalogDocument((draft) => {
      const category = draft.categories.find((item) => item.id === id);
      if (!category) throw new AppError(404, "CATEGORY_NOT_FOUND", "Không tìm thấy danh mục");
      if (category.updatedAt !== actor.expectedUpdatedAt) {
        throw new AppError(409, "STALE_CATALOG_WRITE", "Danh mục đã được thay đổi. Hãy tải lại trang trước khi tiếp tục.", { currentUpdatedAt: category.updatedAt });
      }
      category.active = false;
      category.updatedAt = new Date().toISOString();
      return structuredClone(category);
    });
    invalidateCatalog({ products: true, categories: true });
    return result;
  }
  const result = await getDatabase().transaction(async (tx) => {
    const [category] = await tx.update(categories).set({ active: false, updatedAt: new Date() }).where(eq(categories.id, id)).returning();
    if (!category) throw new AppError(404, "CATEGORY_NOT_FOUND", "Không tìm thấy danh mục");
    await tx.insert(auditLogs).values({ adminId: actor.adminId, action: "CATEGORY_DEACTIVATED", entityType: "Category", entityId: id, requestId: actor.requestId });
    return category;
  });
  invalidateCatalog({ products: true, categories: true });
  return result;
}

const imageRoleSchema = z.enum([
  "GALLERY",
  "HERO_CUTOUT",
  "HERO_BACKGROUND",
  "HERO_BACKGROUND_MOBILE",
  "FEATURED_BACKGROUND",
  "FEATURED_BACKGROUND_MOBILE",
  "INGREDIENT_SHOWCASE",
  "USAGE",
]);

const variantMutationSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().trim().toUpperCase().min(2).max(80),
  weightGrams: z.number().int().positive().max(1_000_000),
  price: z.number().int().min(0).max(1_000_000_000),
  originalPrice: z.number().int().min(0).max(1_000_000_000).optional().nullable(),
  stock: z.number().int().min(0).max(10_000_000),
  expectedVersion: z.number().int().positive().optional(),
  stockReason: z.string().trim().max(500).optional(),
  active: z.boolean(),
}).strict().refine((value) => value.originalPrice == null || value.originalPrice >= value.price, { message: "Giá gốc phải lớn hơn hoặc bằng giá bán" });

const imageMutationSchema = z.object({
  id: z.string().uuid().optional(),
  url: z.string().trim().min(1).max(2048),
  storageProvider: z.enum(["LOCAL", "VERCEL_BLOB"]),
  blobPathname: z.string().trim().max(1024).optional().nullable(),
  role: imageRoleSchema,
  alt: z.string().trim().max(200),
  focalX: z.number().int().min(0).max(100).default(50),
  focalY: z.number().int().min(0).max(100).default(50),
  sortOrder: z.number().int().min(0).max(10000).default(0),
  isPrimary: z.boolean().default(false),
}).strict();

type ImageMutation = z.output<typeof imageMutationSchema>;

async function readOwnedImageBytes(image: ImageMutation): Promise<Buffer> {
  if (image.storageProvider === "LOCAL") {
    let pathname: string;
    try {
      const parsed = new URL(image.url, "https://moon-spice.local");
      if (parsed.origin !== "https://moon-spice.local" || parsed.search || parsed.hash) throw new Error("invalid local URL");
      pathname = decodeURIComponent(parsed.pathname);
    } catch {
      throw new AppError(400, "INVALID_IMAGE_REFERENCE", "Đường dẫn ảnh local không hợp lệ");
    }
    const publicRoot = path.resolve(process.cwd(), "public");
    const resolved = path.resolve(publicRoot, `.${pathname}`);
    if (!resolved.startsWith(`${publicRoot}${path.sep}`)) throw new AppError(400, "INVALID_IMAGE_REFERENCE", "Đường dẫn ảnh local vượt ngoài thư mục public");
    try {
      return await readFile(resolved);
    } catch {
      throw new AppError(400, "IMAGE_NOT_FOUND", "Không đọc được ảnh HERO_CUTOUT");
    }
  }

  if (!validBlobReference(image.url, image.blobPathname)) throw new AppError(400, "INVALID_IMAGE_REFERENCE", "Ảnh Blob không hợp lệ");
  let response: Response;
  try {
    response = await fetch(image.url, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
  } catch {
    throw new AppError(400, "IMAGE_UNAVAILABLE", "Không thể kiểm tra ảnh HERO_CUTOUT");
  }
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (!response.ok || contentLength > 4 * 1024 * 1024) throw new AppError(400, "IMAGE_UNAVAILABLE", "Ảnh HERO_CUTOUT không hợp lệ hoặc quá lớn");
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength > 4 * 1024 * 1024) throw new AppError(400, "IMAGE_UNAVAILABLE", "Ảnh HERO_CUTOUT quá lớn");
  return bytes;
}

async function assertHeroCutout(image: ImageMutation): Promise<void> {
  const bytes = await readOwnedImageBytes(image);
  try {
    const metadata = await sharp(bytes, { failOn: "warning", limitInputPixels: 4096 * 4096 }).metadata();
    if (!metadata.hasAlpha) throw new Error("missing alpha channel");
    const { data, info } = await sharp(bytes)
      .rotate()
      .resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const borderWidth = Math.max(1, Math.floor(Math.min(info.width, info.height) * 0.03));
    let transparent = 0;
    let borderTransparent = 0;
    let borderPixels = 0;
    for (let y = 0; y < info.height; y += 1) {
      for (let x = 0; x < info.width; x += 1) {
        const isBorder = x < borderWidth || y < borderWidth || x >= info.width - borderWidth || y >= info.height - borderWidth;
        const isTransparent = data[(y * info.width + x) * info.channels + 3] < 245;
        if (isTransparent) transparent += 1;
        if (isBorder) {
          borderPixels += 1;
          if (isTransparent) borderTransparent += 1;
        }
      }
    }
    if (transparent / (info.width * info.height) < 0.01 || borderTransparent / borderPixels < 0.2) {
      throw new Error("insufficient transparent border");
    }
  } catch {
    throw new AppError(400, "INVALID_HERO_CUTOUT", "HERO_CUTOUT cần PNG/WebP/AVIF có alpha thật và vùng trong suốt rõ ràng ở biên ảnh");
  }
}

const suggestionMutationSchema = z.object({
  id: z.string().uuid().optional(),
  productImageId: z.string().uuid(),
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().max(200).optional().nullable(),
  sortOrder: z.number().int().min(0).max(10000),
  active: z.boolean(),
}).strict();

const productMutationSchema = z.object({
  id: z.string().uuid().optional(),
  expectedUpdatedAt: z.string().datetime({ offset: true }).optional(),
  categoryId: z.string().uuid(),
  name: z.string().trim().min(2).max(160),
  slug: slugSchema,
  description: z.string().trim().min(10).max(10000),
  shortDescription: z.string().trim().min(5).max(500),
  ingredients: z.string().trim().max(5000).optional().nullable(),
  usage: z.string().trim().max(5000).optional().nullable(),
  storageInstructions: z.string().trim().max(2000).optional().nullable(),
  origin: z.string().trim().max(200).optional().nullable(),
  manufacturer: z.string().trim().max(300).optional().nullable(),
  distributor: z.string().trim().max(300).optional().nullable(),
  shelfLife: z.string().trim().max(300).optional().nullable(),
  allergenWarning: z.string().trim().max(2000).optional().nullable(),
  nutritionInfo: z.string().trim().max(5000).optional().nullable(),
  bestSeller: z.boolean().default(false),
  active: z.boolean().default(false),
  variants: z.array(variantMutationSchema).max(50),
  images: z.array(imageMutationSchema).max(12),
  suggestions: z.array(suggestionMutationSchema).max(4),
}).strict();

export type ProductMutationInput = z.input<typeof productMutationSchema>;

function validateProductAssets(input: z.output<typeof productMutationSchema>): void {
  if (input.active && input.variants.filter((variant) => variant.active).length < 1) {
    throw new AppError(400, "ACTIVE_VARIANT_REQUIRED", "Sản phẩm đang hoạt động cần ít nhất một biến thể hoạt động");
  }
  if (input.active && input.images.filter((image) => image.isPrimary).length !== 1) {
    throw new AppError(400, "PRIMARY_IMAGE_REQUIRED", "Sản phẩm đang hoạt động cần đúng một ảnh chính");
  }
  const exclusiveRoles = new Set(["HERO_CUTOUT", "HERO_BACKGROUND", "HERO_BACKGROUND_MOBILE", "FEATURED_BACKGROUND", "FEATURED_BACKGROUND_MOBILE", "INGREDIENT_SHOWCASE"]);
  const seenRoles = new Set<string>();
  for (const image of input.images) {
    if (image.isPrimary && !["GALLERY", "HERO_CUTOUT"].includes(image.role)) throw new AppError(400, "INVALID_PRIMARY_IMAGE", "Vai trò ảnh chính không hợp lệ");
    if (image.storageProvider === "LOCAL" && (!image.url.startsWith("/") || image.blobPathname)) throw new AppError(400, "INVALID_IMAGE_REFERENCE", "Ảnh local không hợp lệ");
    if (image.storageProvider === "VERCEL_BLOB" && !validBlobReference(image.url, image.blobPathname)) throw new AppError(400, "INVALID_IMAGE_REFERENCE", "Ảnh Blob không hợp lệ");
    if (exclusiveRoles.has(image.role) && seenRoles.has(image.role)) throw new AppError(400, "DUPLICATE_IMAGE_ROLE", `Chỉ được có một ảnh ${image.role}`);
    seenRoles.add(image.role);
  }
  const activeSortOrders = new Set<number>();
  const suppliedImageIds = new Set(input.images.flatMap((image) => image.id ? [image.id] : []));
  for (const suggestion of input.suggestions.filter((item) => item.active)) {
    if (!suppliedImageIds.has(suggestion.productImageId)) {
      throw new AppError(400, "INVALID_USAGE_IMAGE", "Mỗi gợi ý phải tham chiếu một ảnh USAGE có id trong cùng payload");
    }
    if (activeSortOrders.has(suggestion.sortOrder)) throw new AppError(400, "DUPLICATE_SUGGESTION_ORDER", "Thứ tự gợi ý sử dụng bị trùng");
    activeSortOrders.add(suggestion.sortOrder);
  }
}

async function saveJsonProduct(input: z.output<typeof productMutationSchema>): Promise<CatalogProductRecord> {
  const { result } = await mutateCatalogDocument((draft) => {
    const category = draft.categories.find((item) => item.id === input.categoryId);
    if (!category || (input.active && !category.active)) throw new AppError(400, "INVALID_CATEGORY", "Danh mục không tồn tại hoặc đã bị tắt");
    const existing = input.id ? draft.products.find((item) => item.id === input.id) : undefined;
    if (input.id && !existing) throw new AppError(404, "PRODUCT_NOT_FOUND", "Không tìm thấy sản phẩm");
    if (existing && existing.updatedAt !== input.expectedUpdatedAt) {
      throw new AppError(409, "STALE_CATALOG_WRITE", "Sản phẩm đã được thay đổi. Hãy tải lại trang trước khi lưu tiếp.", { currentUpdatedAt: existing.updatedAt });
    }
    if (existing && existing.slug !== input.slug) throw new AppError(409, "SLUG_IMMUTABLE", "Slug sản phẩm không thể thay đổi sau khi tạo");
    if (draft.products.some((item) => item.slug === input.slug && item.id !== input.id)) throw new AppError(409, "CONFLICT", "Slug sản phẩm đã tồn tại");

    const now = nextIsoTimestamp(existing?.updatedAt);

    const productId = existing?.id ?? input.id ?? randomUUID();
    const existingImages = draft.productImages.filter((item) => item.productId === productId);
    const existingVariants = draft.productVariants.filter((item) => item.productId === productId);
    const existingSuggestions = draft.usageSuggestions.filter((item) => item.productId === productId);
    const existingImageIds = new Set(existingImages.map((item) => item.id));
    const existingVariantById = new Map(existingVariants.map((item) => [item.id, item]));
    const existingSuggestionIds = new Set(existingSuggestions.map((item) => item.id));

    for (const image of input.images) {
      if (image.id && !existingImageIds.has(image.id) && draft.productImages.some((item) => item.id === image.id)) {
        throw new AppError(409, "IMAGE_OWNERSHIP_MISMATCH", "Ảnh thuộc sản phẩm khác");
      }
    }
    for (const variant of input.variants) {
      const before = variant.id ? existingVariantById.get(variant.id) : undefined;
      if (variant.id && !before && draft.productVariants.some((item) => item.id === variant.id)) {
        throw new AppError(409, "VARIANT_OWNERSHIP_MISMATCH", "Biến thể thuộc sản phẩm khác");
      }
      if (before && before.stock !== variant.stock && (variant.expectedVersion !== before.version || !variant.stockReason?.trim())) {
        throw new AppError(409, "STALE_INVENTORY", "Tồn kho đã thay đổi; hãy tải lại sản phẩm trước khi lưu");
      }
    }
    for (const suggestion of input.suggestions) {
      if (suggestion.id && !existingSuggestionIds.has(suggestion.id) && draft.usageSuggestions.some((item) => item.id === suggestion.id)) {
        throw new AppError(409, "SUGGESTION_OWNERSHIP_MISMATCH", "Gợi ý thuộc sản phẩm khác");
      }
    }

    const saved: CatalogProductRecord = {
      id: productId, categoryId: input.categoryId, name: input.name, slug: input.slug,
      shortDescription: input.shortDescription, description: input.description,
      ingredients: input.ingredients ?? "", usage: input.usage ?? "", storageInstructions: input.storageInstructions ?? "",
      origin: input.origin ?? "", manufacturer: input.manufacturer ?? "", distributor: input.distributor ?? "",
      shelfLife: input.shelfLife ?? "", allergenWarning: input.allergenWarning ?? "", nutritionInfo: input.nutritionInfo ?? "",
      bestSeller: input.bestSeller, active: input.active, createdAt: existing?.createdAt ?? now, updatedAt: now,
    };
    const productIndex = existing ? draft.products.indexOf(existing) : -1;
    if (productIndex >= 0) draft.products[productIndex] = saved;
    else draft.products.push(saved);

    draft.productImages = draft.productImages.filter((item) => item.productId !== productId);
    draft.productVariants = draft.productVariants.filter((item) => item.productId !== productId);
    draft.usageSuggestions = draft.usageSuggestions.filter((item) => item.productId !== productId);

    const resolvedImageIds = new Map<string, string>();
    for (const image of input.images) {
      const id = image.id ?? randomUUID();
      if (image.id) resolvedImageIds.set(image.id, id);
      draft.productImages.push({
        id, productId, url: image.url, alt: image.alt, storageProvider: image.storageProvider,
        blobPathname: image.blobPathname ?? null, role: image.role, focalX: image.focalX, focalY: image.focalY,
        isPrimary: image.isPrimary, sortOrder: image.sortOrder,
        createdAt: existingImages.find((item) => item.id === image.id)?.createdAt ?? now,
      });
    }
    for (const variant of input.variants) {
      const before = variant.id ? existingVariantById.get(variant.id) : undefined;
      const stockChanged = Boolean(before && before.stock !== variant.stock);
      draft.productVariants.push({
        id: variant.id ?? randomUUID(), productId, sku: variant.sku, weightGrams: variant.weightGrams,
        price: variant.price, originalPrice: variant.originalPrice ?? null, stock: variant.stock,
        version: before ? before.version + (stockChanged ? 1 : 0) : 1, active: variant.active,
        createdAt: before?.createdAt ?? now, updatedAt: now,
      });
    }
    for (const suggestion of input.suggestions) {
      draft.usageSuggestions.push({
        id: suggestion.id ?? randomUUID(), productId,
        productImageId: resolvedImageIds.get(suggestion.productImageId) ?? suggestion.productImageId,
        title: suggestion.title, description: suggestion.description ?? null, sortOrder: suggestion.sortOrder,
        active: suggestion.active,
        createdAt: existingSuggestions.find((item) => item.id === suggestion.id)?.createdAt ?? now, updatedAt: now,
      });
    }
    const keptBlobPathnames = new Set(input.images.flatMap((image) => image.storageProvider === "VERCEL_BLOB" && image.blobPathname ? [image.blobPathname] : []));
    const removedBlobPathnames = existingImages.flatMap((image) => image.storageProvider === "VERCEL_BLOB" && image.blobPathname && !keptBlobPathnames.has(image.blobPathname) ? [image.blobPathname] : []);
    return { saved: structuredClone(saved), removedBlobPathnames };
  });
  invalidateCatalog({ products: true });
  await cleanupRemovedJsonBlobs(result.removedBlobPathnames);
  return result.saved;
}

export async function saveProduct(rawInput: ProductMutationInput, actor: { adminId: string; requestId?: string }) {
  const input = productMutationSchema.parse(rawInput);
  validateProductAssets(input);
  await Promise.all(input.images.filter((image) => image.role === "HERO_CUTOUT").map(assertHeroCutout));
  if (usesJsonCatalogBackend()) return saveJsonProduct(input);
  const result = await getDatabase().transaction(async (tx) => {
    const [category] = await tx.select({ id: categories.id, active: categories.active }).from(categories).where(eq(categories.id, input.categoryId)).for("share").limit(1);
    if (!category || (input.active && !category.active)) throw new AppError(400, "INVALID_CATEGORY", "Danh mục không tồn tại hoặc đã bị tắt");
    const existing = input.id ? (await tx.select().from(products).where(eq(products.id, input.id)).for("update").limit(1))[0] : undefined;
    if (input.id && !existing) throw new AppError(404, "PRODUCT_NOT_FOUND", "Không tìm thấy sản phẩm");
    if (existing && existing.slug !== input.slug) throw new AppError(409, "SLUG_IMMUTABLE", "Slug sản phẩm không thể thay đổi sau khi tạo");
    const productId = existing?.id ?? input.id ?? randomUUID();
    const productValues = {
      categoryId: input.categoryId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      shortDescription: input.shortDescription,
      ingredients: input.ingredients || null,
      usage: input.usage || null,
      storageInstructions: input.storageInstructions || null,
      origin: input.origin || null,
      manufacturer: input.manufacturer || null,
      distributor: input.distributor || null,
      shelfLife: input.shelfLife || null,
      allergenWarning: input.allergenWarning || null,
      nutritionInfo: input.nutritionInfo || null,
      bestSeller: input.bestSeller,
      active: false,
      updatedAt: new Date(),
    };
    if (existing) await tx.update(products).set(productValues).where(eq(products.id, productId));
    else await tx.insert(products).values({ id: productId, ...productValues });

    const existingImages = existing
      ? await tx.select().from(productImages).where(eq(productImages.productId, productId)).for("update")
      : [];
    const existingVariants = existing
      ? await tx.select().from(productVariants).where(eq(productVariants.productId, productId)).for("update")
      : [];
    const existingSuggestions = existing
      ? await tx.select().from(productUsageSuggestions).where(eq(productUsageSuggestions.productId, productId)).for("update")
      : [];

    const keptSuggestionIds = new Set(input.suggestions.flatMap((item) => item.id ? [item.id] : []));
    const removedSuggestionIds = existingSuggestions.filter((item) => !keptSuggestionIds.has(item.id)).map((item) => item.id);
    if (removedSuggestionIds.length > 0) {
      await tx.delete(productUsageSuggestions).where(inArray(productUsageSuggestions.id, removedSuggestionIds));
    }

    const keptImageIds = new Set(input.images.flatMap((item) => item.id ? [item.id] : []));
    const removedImages = existingImages.filter((item) => !keptImageIds.has(item.id));
    // Clear partial-unique placements before applying the submitted full image set.
    if (existingImages.length > 0) {
      await tx
        .update(productImages)
        .set({ isPrimary: false, role: "GALLERY" })
        .where(eq(productImages.productId, productId));
    }
    if (removedImages.length > 0) {
      await tx.delete(productImages).where(inArray(productImages.id, removedImages.map((item) => item.id)));
      for (const image of removedImages) {
        if (image.storageProvider === "VERCEL_BLOB" && image.blobPathname) {
          await tx
            .insert(blobCleanupJobs)
            .values({ pathname: image.blobPathname, reason: "CATALOG_IMAGE_REMOVED" })
            .onConflictDoUpdate({
              target: blobCleanupJobs.pathname,
              set: { reason: "CATALOG_IMAGE_REMOVED", status: "PENDING", attempts: 0, nextAttemptAt: new Date(), lastErrorCode: null, updatedAt: new Date() },
            });
        }
      }
    }

    const keptVariantIds = new Set(input.variants.flatMap((item) => item.id ? [item.id] : []));
    const removedVariantIds = existingVariants.filter((item) => !keptVariantIds.has(item.id)).map((item) => item.id);
    if (removedVariantIds.length > 0) {
      await tx.update(productVariants).set({ active: false, updatedAt: new Date() }).where(inArray(productVariants.id, removedVariantIds));
    }

    const resolvedImageIds = new Map<string, string>();
    for (const image of input.images) {
      const imageId = image.id ?? randomUUID();
      if (image.storageProvider === "VERCEL_BLOB" && image.blobPathname) {
        await tx.execute(sql`select pg_advisory_xact_lock(${advisoryLockKey(sha256(`blob:${image.blobPathname}`))})`);
        const [trackedUpload] = await tx.select({ id: blobCleanupJobs.id }).from(blobCleanupJobs).where(eq(blobCleanupJobs.pathname, image.blobPathname)).limit(1);
        if (!trackedUpload) throw new AppError(400, "UNTRACKED_BLOB", "Ảnh Blob chưa được upload qua Moon Spice");
      }
      if (image.id) {
        const [owned] = await tx.select({ productId: productImages.productId }).from(productImages).where(eq(productImages.id, image.id)).limit(1);
        if (owned && owned.productId !== productId) throw new AppError(409, "IMAGE_OWNERSHIP_MISMATCH", "Ảnh thuộc sản phẩm khác");
      }
      await tx
        .insert(productImages)
        .values({
          id: imageId,
          productId,
          url: image.url,
          storageProvider: image.storageProvider,
          blobPathname: image.blobPathname || null,
          role: image.role,
          alt: image.alt,
          focalX: image.focalX,
          focalY: image.focalY,
          sortOrder: image.sortOrder,
          isPrimary: image.isPrimary,
        })
        .onConflictDoUpdate({
          target: productImages.id,
          set: {
            url: image.url,
            storageProvider: image.storageProvider,
            blobPathname: image.blobPathname || null,
            role: image.role,
            alt: image.alt,
            focalX: image.focalX,
            focalY: image.focalY,
            sortOrder: image.sortOrder,
            isPrimary: image.isPrimary,
          },
        });
      if (image.storageProvider === "VERCEL_BLOB" && image.blobPathname) {
        await tx
          .update(blobCleanupJobs)
          .set({ status: "DONE", lastErrorCode: "ATTACHED_TO_CATALOG", updatedAt: new Date() })
          .where(eq(blobCleanupJobs.pathname, image.blobPathname));
      }
      if (image.id) resolvedImageIds.set(image.id, imageId);
    }

    for (const variant of input.variants) {
      const variantId = variant.id ?? randomUUID();
      const [before] = variant.id ? await tx.select().from(productVariants).where(eq(productVariants.id, variant.id)).for("update").limit(1) : [];
      if (before && before.productId !== productId) throw new AppError(409, "VARIANT_OWNERSHIP_MISMATCH", "Biến thể thuộc sản phẩm khác");
      const stockChanged = Boolean(before && before.stock !== variant.stock);
      if (stockChanged && (variant.expectedVersion !== before?.version || !variant.stockReason?.trim())) {
        throw new AppError(409, "STALE_INVENTORY", "Điều chỉnh tồn kho cần version mới nhất và lý do");
      }
      await tx
        .insert(productVariants)
        .values({
          id: variantId,
          productId,
          sku: variant.sku,
          weightGrams: variant.weightGrams,
          price: variant.price,
          originalPrice: variant.originalPrice ?? null,
          stock: variant.stock,
          version: before ? before.version + (stockChanged ? 1 : 0) : 1,
          active: variant.active,
        })
        .onConflictDoUpdate({
          target: productVariants.id,
          set: {
            sku: variant.sku,
            weightGrams: variant.weightGrams,
            price: variant.price,
            originalPrice: variant.originalPrice ?? null,
            stock: variant.stock,
            version: before ? before.version + (stockChanged ? 1 : 0) : 1,
            active: variant.active,
            updatedAt: new Date(),
          },
        });
      if (stockChanged && before) {
        await tx.insert(auditLogs).values({
          adminId: actor.adminId,
          action: "INVENTORY_ADJUSTED",
          entityType: "ProductVariant",
          entityId: variantId,
          productVariantId: variantId,
          stockDelta: variant.stock - before.stock,
          reason: variant.stockReason?.trim(),
          requestId: actor.requestId,
        });
      }
    }

    for (const suggestion of input.suggestions) {
      const imageId = resolvedImageIds.get(suggestion.productImageId) ?? suggestion.productImageId;
      const [image] = await tx.select({ productId: productImages.productId, role: productImages.role }).from(productImages).where(eq(productImages.id, imageId)).limit(1);
      if (!image || image.productId !== productId || image.role !== "USAGE") throw new AppError(400, "INVALID_USAGE_IMAGE", "Ảnh gợi ý phải thuộc sản phẩm và có role USAGE");
      const suggestionId = suggestion.id ?? randomUUID();
      if (suggestion.id) {
        const [owned] = await tx
          .select({ productId: productUsageSuggestions.productId })
          .from(productUsageSuggestions)
          .where(eq(productUsageSuggestions.id, suggestion.id))
          .limit(1);
        if (owned && owned.productId !== productId) throw new AppError(409, "SUGGESTION_OWNERSHIP_MISMATCH", "Gợi ý thuộc sản phẩm khác");
      }
      await tx
        .insert(productUsageSuggestions)
        .values({ id: suggestionId, productId, productImageId: imageId, title: suggestion.title, description: suggestion.description || null, sortOrder: suggestion.sortOrder, active: suggestion.active })
        .onConflictDoUpdate({ target: productUsageSuggestions.id, set: { productImageId: imageId, title: suggestion.title, description: suggestion.description || null, sortOrder: suggestion.sortOrder, active: suggestion.active, updatedAt: new Date() } });
    }

    const [activeVariants, primaryImages] = await Promise.all([
      tx.select({ id: productVariants.id }).from(productVariants).where(and(eq(productVariants.productId, productId), eq(productVariants.active, true))),
      tx.select({ id: productImages.id }).from(productImages).where(and(eq(productImages.productId, productId), eq(productImages.isPrimary, true))),
    ]);
    if (input.active && (activeVariants.length < 1 || primaryImages.length !== 1)) throw new AppError(400, "PRODUCT_INVARIANT_FAILED", "Sản phẩm hoạt động cần biến thể và đúng một ảnh chính");
    const [saved] = await tx.update(products).set({ active: input.active, updatedAt: new Date() }).where(eq(products.id, productId)).returning();
    await tx.insert(auditLogs).values({
      adminId: actor.adminId,
      action: existing ? "PRODUCT_UPDATED" : "PRODUCT_CREATED",
      entityType: "Product",
      entityId: productId,
      requestId: actor.requestId,
      beforeData: existing,
      afterData: saved,
    });
    return saved;
  });
  invalidateCatalog({ products: true });
  return result;
}

export async function deactivateProduct(id: string, actor: { adminId: string; requestId?: string; expectedUpdatedAt?: string }) {
  if (usesJsonCatalogBackend()) {
    const { result } = await mutateCatalogDocument((draft) => {
      const product = draft.products.find((item) => item.id === id);
      if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Không tìm thấy sản phẩm");
      if (product.updatedAt !== actor.expectedUpdatedAt) {
        throw new AppError(409, "STALE_CATALOG_WRITE", "Sản phẩm đã được thay đổi. Hãy tải lại trang trước khi tiếp tục.", { currentUpdatedAt: product.updatedAt });
      }
      product.active = false;
      product.updatedAt = new Date().toISOString();
      return structuredClone(product);
    });
    invalidateCatalog({ products: true });
    return result;
  }
  const result = await getDatabase().transaction(async (tx) => {
    const [product] = await tx.update(products).set({ active: false, updatedAt: new Date() }).where(eq(products.id, id)).returning();
    if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Không tìm thấy sản phẩm");
    await tx.insert(auditLogs).values({ adminId: actor.adminId, action: "PRODUCT_DEACTIVATED", entityType: "Product", entityId: id, requestId: actor.requestId });
    return product;
  });
  invalidateCatalog({ products: true });
  return result;
}
