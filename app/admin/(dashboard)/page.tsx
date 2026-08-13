import { AlertTriangle, Boxes } from "lucide-react";
import Link from "next/link";

import { requireAdminPageSession } from "@/app/admin/_lib/auth";
import { readAdminDashboard } from "@/app/admin/_lib/data";
import { AdminPageHeader, StatCard } from "@/components/admin/AdminUi";

export default async function AdminDashboardPage() {
  await requireAdminPageSession();
  const data = await readAdminDashboard();
  return (
    <>
      <AdminPageHeader
        eyebrow="Catalog"
        title="Quản lý nội dung"
        description="Cập nhật sản phẩm, danh mục, hình ảnh và thông tin liên hệ hiển thị trên website."
        actions={<Link href="/admin/products/new" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#8f201c] px-4 text-sm font-bold text-white shadow-md">+ Thêm sản phẩm</Link>}
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Chỉ số catalog">
        <StatCard label="Sản phẩm" value={data.productCount.toLocaleString("vi-VN")} helper="Sản phẩm trong catalog" icon={<Boxes size={20} />} />
        <StatCard label="Biến thể cần kiểm tra" value={data.lowStockCount.toLocaleString("vi-VN")} helper="Biến thể có số lượng hiển thị ≤ 10" icon={<AlertTriangle size={20} />} />
        <article className="rounded-2xl border border-[#d9cfb8] bg-[#fffdf8] p-5 shadow-[0_12px_30px_rgb(50_43_28/6%)]">
          <p className="text-[11px] font-bold tracking-[0.15em] text-[#716d61] uppercase">Catalog mode</p>
          <p className="mt-4 font-display text-2xl text-[#292720]">Thông tin sản phẩm</p>
          <p className="mt-2 text-xs leading-5 text-[#716d61]">Website không có giỏ hàng, thanh toán, đơn hàng hay dữ liệu khách hàng.</p>
        </article>
      </section>
    </>
  );
}
