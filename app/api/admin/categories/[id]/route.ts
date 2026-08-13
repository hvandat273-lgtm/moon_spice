import { assertAdminMutationAllowed, requireAdminApiSession } from "@/app/admin/_lib/auth";
import { assertAdminMutationRequest } from "@/app/admin/_lib/http";
import { backendCategory } from "@/app/admin/_lib/payloads";
import { adminCategorySchema } from "@/app/admin/_lib/validation";
import { deactivateCategory, saveCategory } from "@/lib/server/admin";
import { apiSuccess, parseJsonBody, route } from "@/lib/server/api";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) { return route(request, async (requestId) => { assertAdminMutationRequest(request); const principal = await requireAdminApiSession(request); assertAdminMutationAllowed(principal, "catalog"); const input = adminCategorySchema.parse(await parseJsonBody(request, 32 * 1024)); const saved = await saveCategory(backendCategory(input, (await context.params).id), { adminId: principal.id, requestId }); return apiSuccess({ id: saved.id }, requestId); }); }
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) { return route(request, async (requestId) => { assertAdminMutationRequest(request); const principal = await requireAdminApiSession(request); assertAdminMutationAllowed(principal, "catalog"); const body = z.object({ expectedUpdatedAt: z.string().datetime({ offset: true }) }).strict().parse(await parseJsonBody(request, 4 * 1024)); const saved = await deactivateCategory((await context.params).id, { adminId: principal.id, requestId, expectedUpdatedAt: body.expectedUpdatedAt }); return apiSuccess({ id: saved.id, active: saved.active }, requestId); }); }
