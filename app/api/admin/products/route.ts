import { assertAdminMutationAllowed, requireAdminApiSession } from "@/app/admin/_lib/auth";
import { readAdminProducts } from "@/app/admin/_lib/data";
import { assertAdminMutationRequest } from "@/app/admin/_lib/http";
import { backendProduct } from "@/app/admin/_lib/payloads";
import { adminProductSchema } from "@/app/admin/_lib/validation";
import { saveProduct } from "@/lib/server/admin";
import { apiSuccess, parseJsonBody, route } from "@/lib/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return route(request, async (requestId) => {
    await requireAdminApiSession(request);
    const url = new URL(request.url);
    return apiSuccess(await readAdminProducts({ page: Number(url.searchParams.get("page")) || 1, q: url.searchParams.get("q") ?? "" }), requestId);
  });
}

export async function POST(request: Request) {
  return route(request, async (requestId) => {
    assertAdminMutationRequest(request);
    const principal = await requireAdminApiSession(request);
    assertAdminMutationAllowed(principal, "catalog");
    const input = adminProductSchema.parse(await parseJsonBody(request, 256 * 1024));
    const saved = await saveProduct(backendProduct(input), { adminId: principal.id, requestId });
    return apiSuccess({ id: saved.id }, requestId, { status: 201 });
  });
}
