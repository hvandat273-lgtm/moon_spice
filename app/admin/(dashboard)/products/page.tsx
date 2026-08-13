import { Pencil, Plus, SearchX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { requireAdminPageSession } from "@/app/admin/_lib/auth";
import { readAdminProducts } from "@/app/admin/_lib/data";
import { ActiveBadge, AdminPageHeader, AdminPagination, adminTableClass, EmptyAdminState, SearchForm, TableFrame } from "@/components/admin/AdminUi";
import { ProductDeactivateButton } from "@/components/admin/AdminActions";
import { formatVnd } from "@/lib/format";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  await requireAdminPageSession();
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const result = await readAdminProducts({ page, q: params.q });
  const queryString = (target: number) => `/admin/products?page=${target}${params.q ? `&q=${encodeURIComponent(params.q)}` : ""}`;
  return (
    <>
      <AdminPageHeader eyebrow="Catalog" title="Sản phẩm" description="Quản lý nội dung, giá bán và tồn kho theo từng biến thể." actions={<Link href="/admin/products/new" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#8f201c] px-4 text-sm font-bold text-white"><Plus size={17} /> Thêm sản phẩm</Link>} />
      <SearchForm action="/admin/products" defaultValue={params.q} placeholder="Tìm theo tên, slug hoặc SKU…" />
      {result.items.length ? (
        <>
          <TableFrame><table className={adminTableClass}>
            <thead><tr><th>Sản phẩm</th><th>Danh mục</th><th>Giá từ</th><th>Tồn kho</th><th>Trạng thái</th><th className="text-right">Thao tác</th></tr></thead>
            <tbody>{result.items.map((product) => (
              <tr key={product.id}>
                <td><div className="flex min-w-60 items-center gap-3"><span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#eee9df]">{product.imageUrl ? <Image src={product.imageUrl} alt="" width={48} height={48} unoptimized className="size-full object-cover" /> : <SearchX size={18} className="text-[#8a8478]" />}</span><span><span className="font-semibold">{product.name}</span><span className="mt-0.5 block text-xs text-[#858074]">/{product.slug} · {product.variantCount} biến thể</span></span></div></td>
                <td>{product.categoryName}</td><td className="font-semibold">{product.minimumPrice == null ? "—" : formatVnd(product.minimumPrice)}</td><td><span className={product.totalStock <= 10 ? "font-bold text-[#8f201c]" : "font-semibold"}>{product.totalStock}</span></td><td><div className="flex flex-col items-start gap-1"><ActiveBadge active={product.active} />{product.bestSeller ? <span className="text-[10px] font-bold tracking-wide text-[#9a722d] uppercase">Bán chạy</span> : null}</div></td>
                <td><div className="flex justify-end gap-2"><Link href={`/admin/products/${product.id}/edit`} aria-label={`Sửa ${product.name}`} className="grid size-9 place-items-center rounded-lg border border-[#ded8ca] bg-white text-[#4b512b] hover:border-[#4b512b]"><Pencil size={15} /></Link><ProductDeactivateButton id={product.id} active={product.active} updatedAt={product.updatedAt} /></div></td>
              </tr>
            ))}</tbody>
          </table></TableFrame>
          <AdminPagination page={result.page} pageCount={result.pageCount} href={queryString} />
        </>
      ) : <EmptyAdminState title="Không tìm thấy sản phẩm" description="Thử từ khóa khác hoặc tạo sản phẩm mới." />}
    </>
  );
}
