import { cache } from "react";

import { redirect } from "next/navigation";

import { readAdminSession } from "@/lib/server/auth";
import { getCatalogBackend, isCommerceEnabled } from "@/lib/server/env";
import { AppError } from "@/lib/server/errors";

import type { AdminPrincipal } from "./types";

export const getAdminPrincipal = cache(async (source?: Request | string | null): Promise<AdminPrincipal | null> => {
  const record = await readAdminSession(source);
  if (!record) return null;
  return {
    id: record.id,
    email: record.email,
    displayName: record.displayName,
    role: record.role,
    demo: false,
  };
});

export async function requireAdminPageSession(): Promise<AdminPrincipal> {
  const principal = await getAdminPrincipal();
  if (!principal) redirect("/admin/login");
  return principal;
}

export async function requireAdminApiSession(source?: Request | string | null): Promise<AdminPrincipal> {
  const principal = await getAdminPrincipal(source);
  if (!principal) throw new AppError(401, "ADMIN_AUTH_REQUIRED", "Vui lòng đăng nhập quản trị");
  return principal;
}

export function assertAdminMutationAllowed(principal: AdminPrincipal, scope: "operations" | "catalog" = "operations"): void {
  if (principal.demo) {
    throw new AppError(403, "ADMIN_SESSION_INVALID", "Phiên quản trị không hợp lệ");
  }
  if (scope === "catalog") {
    if (!getCatalogBackend()) {
      throw new AppError(503, "CATALOG_NOT_CONFIGURED", "Chưa cấu hình nguồn lưu dữ liệu sản phẩm");
    }
    return;
  }
  if (!isCommerceEnabled()) {
    throw new AppError(
      403,
      "COMMERCE_UNAVAILABLE",
      "Quản lý đơn hàng và khách hàng chỉ khả dụng khi hệ thống dùng PostgreSQL ở chế độ thương mại.",
    );
  }
}
