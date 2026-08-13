import { assertAdminMutationAllowed, requireAdminApiSession } from "@/app/admin/_lib/auth";
import { readAdminProduct } from "@/app/admin/_lib/data";
import { assertAdminMutationRequest } from "@/app/admin/_lib/http";
import { backendProduct } from "@/app/admin/_lib/payloads";
import { adminProductSchema } from "@/app/admin/_lib/validation";
import { deactivateProduct, getAdminProduct, saveProduct } from "@/lib/server/admin";
import { apiSuccess, parseJsonBody, route } from "@/lib/server/api";
import { AppError } from "@/lib/server/errors";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return route(request, async (requestId) => { await requireAdminApiSession(request); const item = await readAdminProduct((await context.params).id); if (!item) throw new AppError(404, "PRODUCT_NOT_FOUND", "Không tìm thấy sản phẩm"); return apiSuccess(item, requestId); });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  return route(request, async (requestId) => {
    assertAdminMutationRequest(request); const principal = await requireAdminApiSession(request); assertAdminMutationAllowed(principal, "catalog");
    const input = adminProductSchema.parse(await parseJsonBody(request, 256 * 1024));
    const saved = await saveProduct(backendProduct(input, (await context.params).id), { adminId: principal.id, requestId });
    return apiSuccess({ id: saved.id }, requestId);
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return route(request, async (requestId) => {
    assertAdminMutationRequest(request); const principal = await requireAdminApiSession(request); assertAdminMutationAllowed(principal, "catalog");
    const body = z.object({ operation: z.literal("activate"), expectedUpdatedAt: z.string().datetime({ offset: true }) }).strict().parse(await parseJsonBody(request, 4 * 1024));
    const id = (await context.params).id;
    const current = await getAdminProduct(id);
    if (!current) throw new AppError(404, "PRODUCT_NOT_FOUND", "Không tìm thấy sản phẩm");
    const p = current.product;
    const saved = await saveProduct({
      id, expectedUpdatedAt: body.expectedUpdatedAt, categoryId: p.categoryId, name: p.name, slug: p.slug, description: p.description, shortDescription: p.shortDescription,
      ingredients: p.ingredients, usage: p.usage, storageInstructions: p.storageInstructions, origin: p.origin, manufacturer: p.manufacturer, distributor: p.distributor, shelfLife: p.shelfLife, allergenWarning: p.allergenWarning, nutritionInfo: p.nutritionInfo,
      bestSeller: p.bestSeller, active: true,
      variants: current.variants.map((variant) => ({ id: variant.id, sku: variant.sku, weightGrams: variant.weightGrams, price: variant.price, originalPrice: variant.originalPrice, stock: variant.stock, expectedVersion: variant.version, active: variant.active })),
      images: current.images.map((image) => ({ id: image.id, url: image.url, storageProvider: image.storageProvider, blobPathname: image.blobPathname, role: image.role, alt: image.alt, focalX: image.focalX, focalY: image.focalY, sortOrder: image.sortOrder, isPrimary: image.isPrimary })),
      suggestions: current.suggestions.map((suggestion) => ({ id: suggestion.id, productImageId: suggestion.productImageId, title: suggestion.title, description: suggestion.description, sortOrder: suggestion.sortOrder, active: suggestion.active })),
    }, { adminId: principal.id, requestId });
    return apiSuccess({ id: saved.id, active: saved.active }, requestId);
  });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  return route(request, async (requestId) => { assertAdminMutationRequest(request); const principal = await requireAdminApiSession(request); assertAdminMutationAllowed(principal, "catalog"); const body = z.object({ expectedUpdatedAt: z.string().datetime({ offset: true }) }).strict().parse(await parseJsonBody(request, 4 * 1024)); const saved = await deactivateProduct((await context.params).id, { adminId: principal.id, requestId, expectedUpdatedAt: body.expectedUpdatedAt }); return apiSuccess({ id: saved.id, active: saved.active }, requestId); });
}
