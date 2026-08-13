import { requireAdminPageSession } from "@/app/admin/_lib/auth";
import { readAdminSettings, readHomepageProductOptions } from "@/app/admin/_lib/data";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata = { title: "Cài đặt" };
export default async function AdminSettingsPage() { const principal = await requireAdminPageSession(); const [settings, products] = await Promise.all([readAdminSettings(), readHomepageProductOptions()]); return <><AdminPageHeader eyebrow="Configuration" title="Cài đặt cửa hàng" description="Một nguồn cấu hình dùng chung cho trang chủ, vận chuyển và chính sách lưu trữ." /><SettingsForm settings={settings} products={products} readOnly={principal.demo} /></>; }
