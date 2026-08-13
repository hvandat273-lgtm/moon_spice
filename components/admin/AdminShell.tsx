"use client";

import {
  Boxes,
  ChevronRight,
  FolderTree,
  Gauge,
  LogOut,
  Menu,
  Settings,
  ShoppingBag,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import type { AdminPrincipal } from "@/app/admin/_lib/types";

const navigation = [
  { href: "/admin", label: "Tổng quan", icon: Gauge, exact: true },
  { href: "/admin/products", label: "Sản phẩm", icon: Boxes },
  { href: "/admin/categories", label: "Danh mục", icon: FolderTree },
  { href: "/admin/settings", label: "Cài đặt", icon: Settings },
] as const;

export function AdminShell({ principal, children }: { principal: AdminPrincipal; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex overflow-hidden bg-[#f4f1e9] text-[#282820]">
      {open ? <button className="fixed inset-0 z-30 bg-black/35 lg:hidden" aria-label="Đóng điều hướng" onClick={() => setOpen(false)} /> : null}

      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[17.5rem] flex-col border-r border-white/10 bg-[#2f321d] text-white shadow-2xl transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <Link href="/admin" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <span className="grid size-10 place-items-center rounded-xl bg-[#b18a45] text-[#2f321d] shadow-lg shadow-black/15">
              <ShoppingBag size={20} strokeWidth={2.2} />
            </span>
            <span>
              <span className="block font-display text-xl tracking-[0.08em]">MOOR SPICE</span>
              <span className="block text-[10px] font-semibold tracking-[0.22em] text-white/55 uppercase">Administration</span>
            </span>
          </Link>
          <button className="rounded-lg p-2 text-white/70 hover:bg-white/10 lg:hidden" aria-label="Đóng menu" onClick={() => setOpen(false)}><X size={20} /></button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Điều hướng quản trị">
          {navigation.map((item) => {
            const active = "exact" in item && item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`group flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition ${active ? "bg-white text-[#2f321d] shadow-md" : "text-white/72 hover:bg-white/9 hover:text-white"}`}
              >
                <Icon size={18} aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
                {active ? <ChevronRight size={15} className="text-[#8f201c]" aria-hidden="true" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 rounded-xl bg-white/7 px-3.5 py-3">
            <p className="truncate text-sm font-semibold">{principal.displayName}</p>
            <p className="mt-0.5 truncate text-xs text-white/55">{principal.email}</p>
          </div>
          <button onClick={logout} disabled={loggingOut} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 text-sm font-semibold text-white/70 transition hover:bg-white/9 hover:text-white disabled:opacity-50">
            <LogOut size={18} aria-hidden="true" />
            {loggingOut ? "Đang đăng xuất…" : "Đăng xuất"}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#ded8ca] bg-[#fffdf8]/95 px-4 backdrop-blur md:px-7 lg:h-20">
          <button className="rounded-xl border border-[#ded8ca] bg-white p-2.5 text-[#4b512b] lg:hidden" aria-label="Mở menu" onClick={() => setOpen(true)}><Menu size={20} /></button>
          <div className="hidden lg:block">
            <p className="text-[11px] font-bold tracking-[0.18em] text-[#8f201c] uppercase">Moor Spice</p>
            <p className="text-sm text-[#716d61]">Vận hành cửa hàng</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden rounded-full bg-[#eaf2e4] px-3 py-1 text-[11px] font-bold tracking-wide text-[#365b35] uppercase sm:inline">Đã xác thực</span>
            <span className="grid size-9 place-items-center rounded-full bg-[#8f201c] text-xs font-bold text-white">{principal.displayName.slice(0, 2).toUpperCase()}</span>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[94rem] p-4 md:p-7 lg:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
