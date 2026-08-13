import { assertAdminMutationAllowed, requireAdminApiSession } from "./auth";
import { assertAdminMutationRequest } from "./http";
import { apiSuccess, route } from "@/lib/server/api";
import { AppError } from "@/lib/server/errors";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { uploadImage } from "@/lib/server/uploads";

export async function handleAdminImageUpload(request: Request) {
  return route(request, async (requestId) => {
    assertAdminMutationRequest(request);
    const principal = await requireAdminApiSession(request);
    assertAdminMutationAllowed(principal, "catalog");
    await enforceRateLimit({ action: "admin-upload", key: principal.id, limit: 30, windowSeconds: 60 * 60 });
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 4 * 1024 * 1024) throw new AppError(413, "PAYLOAD_TOO_LARGE", "Ảnh tải lên quá lớn");
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new AppError(400, "IMAGE_REQUIRED", "Vui lòng chọn ảnh");
    const uploaded = await uploadImage(file, { scope: "products" });
    return apiSuccess(uploaded, requestId, { status: 201 });
  });
}
