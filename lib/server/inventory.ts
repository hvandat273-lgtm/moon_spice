import { and, eq, isNotNull, sql } from "drizzle-orm";

import { type Database, getDatabase, hasDatabaseUrl } from "@/db/client";
import { auditLogs, orderItems, orders, productVariants, type OrderRecord } from "@/db/schema";

import { AppError } from "./errors";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

async function restoreInventory(tx: Transaction, order: OrderRecord, reason: string, requestId?: string): Promise<void> {
  if (order.inventoryRestoredAt) return;
  const items = await tx
    .select({ productVariantId: orderItems.productVariantId, quantity: orderItems.quantity })
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id))
    .orderBy(orderItems.productVariantId);
  for (const item of items) {
    await tx
      .update(productVariants)
      .set({
        stock: sql`${productVariants.stock} + ${item.quantity}`,
        version: sql`${productVariants.version} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(productVariants.id, item.productVariantId));
    await tx.insert(auditLogs).values({
      action: "INVENTORY_RESTORED",
      entityType: "ProductVariant",
      entityId: item.productVariantId,
      orderId: order.id,
      productVariantId: item.productVariantId,
      stockDelta: item.quantity,
      reason,
      requestId,
    });
  }
}

async function cancelLockedOrder(tx: Transaction, order: OrderRecord, reason: string, requestId?: string, adminId?: string): Promise<OrderRecord> {
  if (order.status === "CANCELLED") return order;
  if (!(["PENDING", "CONFIRMED", "PREPARING"] as const).includes(order.status as "PENDING" | "CONFIRMED" | "PREPARING")) {
    throw new AppError(409, "INVALID_ORDER_TRANSITION", "Đơn hàng không thể hủy ở trạng thái hiện tại");
  }
  const now = new Date();
  await restoreInventory(tx, order, reason, requestId);
  const [updated] = await tx
    .update(orders)
    .set({
      status: "CANCELLED",
      finalizedAt: now,
      inventoryRestoredAt: order.inventoryRestoredAt ?? now,
      updatedAt: now,
    })
    .where(and(eq(orders.id, order.id), eq(orders.status, order.status)))
    .returning();
  if (!updated) throw new AppError(409, "INVALID_ORDER_TRANSITION", "Trạng thái đơn hàng vừa thay đổi");
  await tx.insert(auditLogs).values({
    adminId,
    action: "ORDER_STATUS_CHANGED",
    entityType: "Order",
    entityId: order.id,
    orderId: order.id,
    fromStatus: order.status,
    toStatus: "CANCELLED",
    reason,
    requestId,
  });
  return updated;
}

async function lockOrder(tx: Transaction, orderId: string): Promise<OrderRecord | null> {
  const [row] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update").limit(1);
  return row ?? null;
}

export async function cancelOrder(orderId: string, input: { reason: string; requestId?: string; adminId?: string }): Promise<OrderRecord> {
  const db = getDatabase();
  return db.transaction(async (tx) => {
    const order = await lockOrder(tx, orderId);
    if (!order) throw new AppError(404, "ORDER_NOT_FOUND", "Không tìm thấy đơn hàng");
    return cancelLockedOrder(tx, order, input.reason, input.requestId, input.adminId);
  });
}

async function expireInTransaction(tx: Transaction, variantIds: readonly string[] | undefined, limit: number, requestId?: string): Promise<number> {
  const filter = variantIds?.length
    ? sql`and exists (
        select 1 from order_items oi
        where oi.order_id = o.id and oi.product_variant_id in ${inArrayValues(variantIds)}
      )`
    : sql``;
  const result = await tx.execute<{ id: string }>(sql`
    select o.id
    from orders o
    where o.status = 'PENDING'
      and o.reservation_expires_at <= now()
      ${filter}
    order by o.reservation_expires_at asc, o.id asc
    for update of o skip locked
    limit ${limit}
  `);
  let expired = 0;
  for (const candidate of result.rows) {
    const order = await lockOrder(tx, candidate.id);
    if (!order || order.status !== "PENDING" || order.reservationExpiresAt > new Date()) continue;
    await cancelLockedOrder(tx, order, "PENDING_RESERVATION_EXPIRED", requestId);
    expired += 1;
  }
  return expired;
}

function inArrayValues(values: readonly string[]) {
  return sql`(${sql.join(values.map((value) => sql`${value}::uuid`), sql`, `)})`;
}

export async function expireReservationsForVariants(variantIds: readonly string[], requestId?: string): Promise<number> {
  if (!hasDatabaseUrl() || variantIds.length === 0) return 0;
  return getDatabase().transaction((tx) => expireInTransaction(tx, [...new Set(variantIds)].sort(), 50, requestId));
}

export async function expireReservationBatch(limit = 50, requestId?: string): Promise<number> {
  if (!hasDatabaseUrl()) return 0;
  return getDatabase().transaction((tx) => expireInTransaction(tx, undefined, Math.min(Math.max(limit, 1), 200), requestId));
}

export async function findOrdersNeedingAssetCleanup(cutoff: Date, limit = 100): Promise<string[]> {
  const rows = await getDatabase()
    .select({ id: orderItems.id })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(and(isNotNull(orderItems.productImageUrl), sql`${orders.finalizedAt} <= ${cutoff}`))
    .limit(limit);
  return rows.map((row) => row.id);
}
