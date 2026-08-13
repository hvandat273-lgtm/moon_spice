import { LockKeyhole, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminPrincipal } from "@/app/admin/_lib/auth";
import { LoginForm } from "@/components/admin/LoginForm";
import { getAdminAuthenticationConfigurationIssue } from "@/lib/server/auth";

export const metadata = { title: "Đăng nhập quản trị" };

export default async function AdminLoginPage() {
  const principal = await getAdminPrincipal();
  if (principal) redirect("/admin");
  const configurationIssue = getAdminAuthenticationConfigurationIssue();

  return (
    <div className="fixed inset-0 z-[80] grid min-h-dvh overflow-y-auto bg-[#f3efe5] lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-[#30331e] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -top-24 -right-20 size-96 rounded-full border border-white/10" />
        <div className="absolute right-24 bottom-20 size-72 rounded-full bg-[#b18a45]/12 blur-3xl" />
        <Link href="/" className="relative z-10 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-[#b18a45] text-[#30331e]"><LockKeyhole size={21} /></span>
          <span>
            <span className="block font-display text-2xl tracking-[0.08em]">MOOR SPICE</span>
            <span className="block text-[10px] font-bold tracking-[0.22em] text-white/55 uppercase">Secure administration</span>
          </span>
        </Link>
        <div className="relative z-10 max-w-xl">
          <p className="mb-4 text-xs font-bold tracking-[0.2em] text-[#d8b66f] uppercase">Không gian vận hành</p>
          <h1 className="font-display text-5xl leading-[1.08]">Quản lý cửa hàng rõ ràng, tập trung và an toàn.</h1>
          <p className="mt-6 max-w-lg text-sm leading-7 text-white/64">Quản lý danh mục, nội dung sản phẩm, tồn kho hiển thị, hình ảnh và thông tin liên hệ trong một giao diện được bảo vệ phía server.</p>
        </div>
        <div className="relative z-10 flex items-center gap-3 text-xs text-white/55"><ShieldCheck size={17} className="text-[#d8b66f]" /> Phiên đăng nhập tự hết hạn sau 2 giờ</div>
      </section>

      <section className="flex min-h-dvh items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 inline-flex items-center gap-2 text-xs font-bold tracking-wide text-[#4b512b] uppercase lg:hidden">← Về cửa hàng</Link>
          <p className="mb-2 text-[11px] font-bold tracking-[0.18em] text-[#8f201c] uppercase">Moor Spice Admin</p>
          <h2 className="font-display text-4xl leading-tight text-[#292720]">Chào mừng trở lại</h2>
          <p className="mt-2 mb-8 text-sm text-[#716d61]">Đăng nhập bằng tài khoản quản trị được cấp cho bạn.</p>
          {configurationIssue ? (
            <div className="rounded-2xl border border-[#e4d4a7] bg-[#fff8df] p-5">
              <p className="font-semibold text-[#6d551d]">Quản trị chưa sẵn sàng</p>
              <p className="mt-1 text-sm leading-6 text-[#806c3d]">{configurationIssue}</p>
            </div>
          ) : <LoginForm />}
          <p className="mt-7 text-center text-xs text-[#8a8478]">Nếu không được cấp quyền, vui lòng quay lại cửa hàng.</p>
        </div>
      </section>
    </div>
  );
}
