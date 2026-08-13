import { assertAdminMutationAllowed, requireAdminApiSession } from "@/app/admin/_lib/auth";
import { readAdminCategories } from "@/app/admin/_lib/data";
import { assertAdminMutationRequest } from "@/app/admin/_lib/http";
import { backendCategory } from "@/app/admin/_lib/payloads";
import { adminCategorySchema } from "@/app/admin/_lib/validation";
import { saveCategory } from "@/lib/server/admin";
import { apiSuccess, parseJsonBody, route } from "@/lib/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) { return route(request, async (requestId) => { await requireAdminApiSession(request); return apiSuccess(await readAdminCategories(), requestId); }); }
export async function POST(request: Request) { return route(request, async (requestId) => { assertAdminMutationRequest(request); const principal = await requireAdminApiSession(request); assertAdminMutationAllowed(principal, "catalog"); const input = adminCategorySchema.parse(await parseJsonBody(request, 32 * 1024)); const saved = await saveCategory(backendCategory(input), { adminId: principal.id, requestId }); return apiSuccess({ id: saved.id }, requestId, { status: 201 }); }); }
