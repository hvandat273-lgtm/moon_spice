import { assertAdminMutationRequest } from "@/app/admin/_lib/http";
import { requireAdminApiSession } from "@/app/admin/_lib/auth";
import { apiSuccess, route } from "@/lib/server/api";
import { clearAdminSessionCookie, logoutAdminSession } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return route(request, async (requestId) => {
    assertAdminMutationRequest(request);
    await requireAdminApiSession(request);
    await logoutAdminSession(request, requestId);
    const response = apiSuccess({ loggedOut: true }, requestId);
    clearAdminSessionCookie(response);
    return response;
  });
}
