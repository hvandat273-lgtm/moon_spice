import { requireAdminPageSession } from "@/app/admin/_lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const principal = await requireAdminPageSession();
  return <AdminShell principal={principal}>{children}</AdminShell>;
}
