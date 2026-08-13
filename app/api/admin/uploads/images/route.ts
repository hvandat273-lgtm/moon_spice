import { handleAdminImageUpload } from "@/app/admin/_lib/upload-handler";
import { assertAdminMutationAllowed, requireAdminApiSession } from "@/app/admin/_lib/auth";
import { assertAdminMutationRequest } from "@/app/admin/_lib/http";
import { apiSuccess, parseJsonBody, route } from "@/lib/server/api";
import { deleteUnreferencedCatalogBlobImages } from "@/lib/server/uploads";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) { return handleAdminImageUpload(request); }

export async function DELETE(request: Request) {
  return route(request, async (requestId) => {
    assertAdminMutationRequest(request);
    const principal = await requireAdminApiSession(request);
    assertAdminMutationAllowed(principal, "catalog");
    const { pathname } = z.object({ pathname: z.string().trim().min(1).max(1024) }).strict().parse(await parseJsonBody(request, 4 * 1024));
    return apiSuccess(await deleteUnreferencedCatalogBlobImages([pathname]), requestId);
  });
}
