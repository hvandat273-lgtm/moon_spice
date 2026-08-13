import { assertAdminMutationAllowed, requireAdminApiSession } from "@/app/admin/_lib/auth";
import { readAdminSettings } from "@/app/admin/_lib/data";
import { assertAdminMutationRequest } from "@/app/admin/_lib/http";
import { adminSettingsSchema } from "@/app/admin/_lib/validation";
import { updateSiteSettings } from "@/lib/server/admin";
import { apiSuccess, parseJsonBody, route } from "@/lib/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { return route(request, async (requestId) => { await requireAdminApiSession(request); return apiSuccess(await readAdminSettings(), requestId); }); }
export async function PUT(request: Request) { return route(request, async (requestId) => { assertAdminMutationRequest(request); const principal = await requireAdminApiSession(request); assertAdminMutationAllowed(principal, "catalog"); const input = adminSettingsSchema.parse(await parseJsonBody(request, 32 * 1024)); const entries = [
  ["hero_product_id", input.heroProductId], ["featured_product_id", input.featuredProductId], ["homepage_best_seller_limit", input.homepageBestSellerLimit], ["free_shipping_threshold", input.freeShippingThreshold], ["default_shipping_fee", input.defaultShippingFee], ["pending_order_expiry_hours", input.pendingOrderExpiryHours], ["order_pii_retention_days", input.orderPiiRetentionDays], ["order_asset_retention_days", input.orderAssetRetentionDays], ["announcement_text", input.announcementText], ["store_contact", input.storeContact],
] as const; await updateSiteSettings(entries, principal.id, requestId, input.expectedRevision); return apiSuccess(await readAdminSettings(), requestId); }); }
