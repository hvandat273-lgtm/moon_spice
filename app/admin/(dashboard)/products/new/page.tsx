import Link from "next/link";

import { requireAdminPageSession } from "@/app/admin/_lib/auth";
import { readAdminCategories } from "@/app/admin/_lib/data";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { ProductEditor } from "@/components/admin/ProductEditor";

export const metadata = { title: "Thêm sản phẩm" };

export default async function NewProductPage() {
  const principal = await requireAdminPageSession();
  const categories = await readAdminCategories();
  if (!categories.some((category) => category.active)) return <><AdminPageHeader eyebrow="Catalog" title="Thêm sản phẩm" description="Cần có ít nhất một danh mục đang hoạt động trước khi tạo sản phẩm." /><div className="rounded-2xl border border-[#ded8ca] bg-[#fffdf8] p-8 text-center"><h2 className="font-display text-2xl">Tạo danh mục trước</h2><p className="mt-2 text-sm text-[#716d61]">Danh mục giúp nhóm và hiển thị sản phẩm đúng trên cửa hàng.</p><Link href="/admin/categories" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#8f201c] px-5 text-sm font-bold text-white">Đi tới Danh mục</Link></div></>;
  return <><AdminPageHeader eyebrow="Catalog" title="Thêm sản phẩm" description="Tạo sản phẩm, biến thể, tồn kho và bộ ảnh hiển thị." actions={<Link href="/admin/products" className="inline-flex min-h-11 items-center rounded-xl border border-[#ded8ca] bg-white px-4 text-sm font-semibold">Quay lại danh sách</Link>} /><ProductEditor categories={categories} readOnly={principal.demo} /></>;
}
