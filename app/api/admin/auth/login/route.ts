import { assertAdminMutationRequest } from "@/app/admin/_lib/http";
import { getAdminPrincipal } from "@/app/admin/_lib/auth";
import { adminLoginSchema } from "@/app/admin/_lib/validation";
import { apiSuccess, clientIpFrom, parseJsonBody, route } from "@/lib/server/api";
import { assertAdminAuthenticationConfigured, loginAdmin, setAdminSessionCookie } from "@/lib/server/auth";
import { AppError } from "@/lib/server/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return route(request, async (requestId) => {
    assertAdminMutationRequest(request);
    assertAdminAuthenticationConfigured();
    if (await getAdminPrincipal(request)) throw new AppError(409, "ALREADY_AUTHENTICATED", "Phiên quản trị đã đăng nhập");
    const input = adminLoginSchema.parse(await parseJsonBody(request, 8 * 1024));
    const result = await loginAdmin({ ...input, ip: clientIpFrom(request), requestId });
    const response = apiSuccess({ admin: result.admin }, requestId);
    setAdminSessionCookie(response, result.token, result.expiresAt);
    return response;
  });
}
