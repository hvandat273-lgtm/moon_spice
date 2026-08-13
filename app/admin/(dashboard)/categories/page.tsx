import { requireAdminPageSession } from "@/app/admin/_lib/auth";
import { readAdminCategories } from "@/app/admin/_lib/data";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { CategoryManager } from "@/components/admin/CategoryManager";

export const metadata = { title: "Danh mục" };

export default async function AdminCategoriesPage() {
  const principal = await requireAdminPageSession();
  const categories = await readAdminCategories();
  return <><AdminPageHeader eyebrow="Catalog" title="Danh mục" description="Sắp xếp và bật/tắt nhóm sản phẩm. Danh mục có sản phẩm chỉ được vô hiệu hóa." /><CategoryManager categories={categories} readOnly={principal.demo} /></>;
}
