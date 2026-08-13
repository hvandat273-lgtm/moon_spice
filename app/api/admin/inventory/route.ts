import { z } from "zod";

import { assertAdminMutationAllowed, requireAdminApiSession } from "@/app/admin/_lib/auth";
import { assertAdminMutationRequest } from "@/app/admin/_lib/http";
import { updateInventory } from "@/lib/server/admin";
import { apiSuccess, parseJsonBody, route } from "@/lib/server/api";

const schema = z.object({
  variantId: z.string().uuid(),
  delta: z.number().int().min(-1_000_000).max(1_000_000).refine((value) => value !== 0),
  expectedVersion: z.number().int().positive(),
  reason: z.string().trim().min(3).max(500),
}).strict();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  return route(request, async (requestId) => {
    assertAdminMutationRequest(request);
    const principal = await requireAdminApiSession(request);
    assertAdminMutationAllowed(principal, "catalog");
    const input = schema.parse(await parseJsonBody(request, 8 * 1024));
    const updated = await updateInventory({ ...input, adminId: principal.id, requestId });
    return apiSuccess({ id: updated.id, stock: updated.stock, version: updated.version }, requestId);
  });
}
