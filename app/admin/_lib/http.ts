import { assertSameOrigin } from "@/lib/server/api";
import { AppError } from "@/lib/server/errors";

export function assertAdminMutationRequest(request: Request): void {
  assertSameOrigin(request);
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (!origin && fetchSite !== "same-origin") {
    throw new AppError(403, "INVALID_ORIGIN", "Nguồn yêu cầu không hợp lệ");
  }
}
