import { ArrowLeft, ArrowRight, Inbox, Search } from "lucide-react";
import Link from "next/link";

export function AdminPageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="mb-1 text-[11px] font-bold tracking-[0.18em] text-[#8f201c] uppercase">{eyebrow}</p> : null}
        <h1 className="font-display text-3xl leading-tight font-medium text-[#292720] md:text-[2.4rem]">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm text-[#716d61]">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({ label, value, helper, icon }: { label: string; value: string; helper?: string; icon: React.ReactNode }) {
  return (
    <article className="rounded-2xl border border-[#ded8ca] bg-[#fffdf8] p-5 shadow-[0_12px_30px_rgb(50_43_28/6%)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <p className="text-[11px] font-bold tracking-[0.15em] text-[#716d61] uppercase">{label}</p>
        <span className="grid size-10 place-items-center rounded-xl bg-[#eef0df] text-[#4b512b]">{icon}</span>
      </div>
      <p className="font-display text-3xl leading-none text-[#292720]">{value}</p>
      {helper ? <p className="mt-2 text-xs text-[#858074]">{helper}</p> : null}
    </article>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${active ? "bg-[#e4f1df] text-[#365b35]" : "bg-[#eeeae5] text-[#6e665c]"}`}>{active ? "Đang hiển thị" : "Đã ẩn"}</span>;
}

export function SearchForm({ action, defaultValue, placeholder, extra }: { action: string; defaultValue?: string; placeholder: string; extra?: React.ReactNode }) {
  return (
    <form action={action} className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#ded8ca] bg-[#fffdf8] p-3 sm:flex-row sm:items-center">
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Tìm kiếm</span>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#8a8478]" size={17} />
        <input name="q" defaultValue={defaultValue} placeholder={placeholder} className="min-h-11 w-full rounded-xl border border-[#ded8ca] bg-white pr-4 pl-10 text-sm outline-none focus:border-[#5f6535] focus:ring-3 focus:ring-[#5f6535]/10" />
      </label>
      {extra}
      <button className="min-h-11 rounded-xl bg-[#4b512b] px-5 text-sm font-bold text-white transition hover:bg-[#3c4322]">Tìm kiếm</button>
    </form>
  );
}

export function EmptyAdminState({ title = "Chưa có dữ liệu", description = "Dữ liệu phù hợp sẽ xuất hiện tại đây." }: { title?: string; description?: string }) {
  return (
    <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-[#cbc2b1] bg-[#fffdf8]/60 p-8 text-center">
      <div>
        <span className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-[#eee9df] text-[#716d61]"><Inbox size={22} /></span>
        <h2 className="font-display text-xl">{title}</h2>
        <p className="mt-1 text-sm text-[#716d61]">{description}</p>
      </div>
    </div>
  );
}

export function AdminPagination({ page, pageCount, href }: { page: number; pageCount: number; href: (page: number) => string }) {
  if (pageCount <= 1) return null;
  return (
    <nav className="mt-5 flex items-center justify-between gap-4" aria-label="Phân trang">
      {page > 1 ? <Link href={href(page - 1)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#ded8ca] bg-white px-4 text-sm font-semibold hover:border-[#5f6535]"><ArrowLeft size={15} /> Trước</Link> : <span />}
      <span className="text-xs font-semibold text-[#716d61]">Trang {page} / {pageCount}</span>
      {page < pageCount ? <Link href={href(page + 1)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#ded8ca] bg-white px-4 text-sm font-semibold hover:border-[#5f6535]">Sau <ArrowRight size={15} /></Link> : <span />}
    </nav>
  );
}

export function TableFrame({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto rounded-2xl border border-[#ded8ca] bg-[#fffdf8] shadow-[0_10px_28px_rgb(50_43_28/5%)]">{children}</div>;
}

export const adminTableClass = "w-full min-w-[760px] border-collapse text-left text-sm [&_th]:border-b [&_th]:border-[#e6e0d5] [&_th]:bg-[#f8f5ee] [&_th]:px-4 [&_th]:py-3 [&_th]:text-[10px] [&_th]:font-bold [&_th]:tracking-[0.12em] [&_th]:text-[#777064] [&_th]:uppercase [&_td]:border-b [&_td]:border-[#eee9df] [&_td]:px-4 [&_td]:py-3.5 [&_tbody_tr:last-child_td]:border-b-0 [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-[#fbf8f1]";
