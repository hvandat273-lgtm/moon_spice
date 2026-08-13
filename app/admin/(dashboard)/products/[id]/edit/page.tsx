import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdminPageSession } from "@/app/admin/_lib/auth";
import { readAdminCategories, readAdminProduct } from "@/app/admin/_lib/data";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { ProductEditor } from "@/components/admin/ProductEditor";

export const metadata = { title: "Sửa sản phẩm" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const principal = await requireAdminPageSession();
  const { id } = await params;
  const [product, categories] = await Promise.all([readAdminProduct(id), readAdminCategories()]);
  if (!product) notFound();
  return <><AdminPageHeader eyebrow="Catalog" title={`Sửa ${product.name}`} description="Slug được khóa để giữ URL ổn định. Thay đổi tồn kho được kiểm tra phiên bản trước khi lưu." actions={<Link href="/admin/products" className="inline-flex min-h-11 items-center rounded-xl border border-[#ded8ca] bg-white px-4 text-sm font-semibold">Quay lại danh sách</Link>} /><ProductEditor categories={categories} initial={product} readOnly={principal.demo} /></>;
}
