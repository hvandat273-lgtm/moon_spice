"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AdminSettingsData } from "@/app/admin/_lib/types";

export function SettingsForm({ settings, products, readOnly }: { settings: AdminSettingsData; products: Array<{ id: string; name: string }>; readOnly: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const input = "mt-2 min-h-11 w-full rounded-xl border border-[#ded8ca] bg-white px-3 text-sm outline-none focus:border-[#5f6535] disabled:bg-[#f2eee6]";
  const label = "block text-sm font-semibold";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly) return;
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const number = (key: string, fallback: number) => form.has(key) ? Number(form.get(key)) : fallback;
    const optionalId = (key: string) => String(form.get(key) ?? "").trim() || null;
    const contactEntries = {
      phone: String(form.get("phone") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      address: String(form.get("address") ?? "").trim(),
      facebookUrl: String(form.get("facebookUrl") ?? "").trim(),
      instagramUrl: String(form.get("instagramUrl") ?? "").trim(),
      amazonUrl: String(form.get("amazonUrl") ?? "").trim(),
    };
    const storeContact = Object.fromEntries(Object.entries(contactEntries).filter(([, value]) => value.length > 0));
    const payload = {
      expectedRevision: settings.expectedRevision,
      heroProductId: optionalId("heroProductId"),
      featuredProductId: optionalId("featuredProductId"),
      homepageBestSellerLimit: number("homepageBestSellerLimit", settings.homepageBestSellerLimit),
      freeShippingThreshold: number("freeShippingThreshold", settings.freeShippingThreshold),
      defaultShippingFee: number("defaultShippingFee", settings.defaultShippingFee),
      pendingOrderExpiryHours: number("pendingOrderExpiryHours", settings.pendingOrderExpiryHours),
      orderPiiRetentionDays: number("orderPiiRetentionDays", settings.orderPiiRetentionDays),
      orderAssetRetentionDays: number("orderAssetRetentionDays", settings.orderAssetRetentionDays),
      announcementText: String(form.get("announcementText") ?? ""),
      storeContact,
    };
    try {
      const response = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as { error?: { message?: string } | null };
      if (!response.ok) throw new Error(result.error?.message ?? "Không thể lưu cài đặt");
      setMessage("Đã lưu cài đặt.");
      router.refresh();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Không thể lưu cài đặt");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <fieldset disabled={readOnly || pending} className="grid gap-6 xl:grid-cols-2 disabled:opacity-75">
        <section className="rounded-2xl border border-[#ded8ca] bg-[#fffdf8] p-5 md:p-6">
          <h2 className="font-display text-2xl">Trang chủ</h2>
          <div className="mt-5 space-y-5">
            <label className={label}>Sản phẩm hero<select name="heroProductId" defaultValue={settings.heroProductId ?? ""} className={input}><option value="">Tự chọn sản phẩm hợp lệ đầu tiên</option>{products.map((product) => <option value={product.id} key={product.id}>{product.name}</option>)}</select></label>
            <label className={label}>Sản phẩm nổi bật<select name="featuredProductId" defaultValue={settings.featuredProductId ?? ""} className={input}><option value="">Tự chọn sản phẩm hợp lệ đầu tiên</option>{products.map((product) => <option value={product.id} key={product.id}>{product.name}</option>)}</select></label>
            <label className={label}>Số sản phẩm nổi bật<input name="homepageBestSellerLimit" type="number" min={1} max={12} defaultValue={settings.homepageBestSellerLimit} className={input} /></label>
            <label className={label}>Thanh thông báo<input name="announcementText" maxLength={160} defaultValue={settings.announcementText} className={input} /></label>
          </div>
        </section>

        <section className="rounded-2xl border border-[#cfd4b7] bg-[#f7f8ef] p-5 md:p-6">
          <h2 className="font-display text-2xl">Chế độ catalog</h2>
          <p className="mt-3 text-sm leading-6 text-[#62674a]">Website chỉ công bố sản phẩm, công thức và thông tin liên hệ. Không có giỏ hàng, thanh toán, đơn hàng hoặc dữ liệu khách hàng.</p>
        </section>

        <section className="rounded-2xl border border-[#ded8ca] bg-[#fffdf8] p-5 md:col-span-2 md:p-6">
          <h2 className="font-display text-2xl">Liên hệ cửa hàng</h2>
          <p className="mt-2 text-sm text-[#777064]">Thông tin hiển thị ở footer và trang liên hệ. Chỉ nhập URL Facebook/Instagram chính thức, bắt đầu bằng https://.</p>
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <label className={label}>Điện thoại<input name="phone" autoComplete="tel" maxLength={24} defaultValue={settings.storeContact.phone} className={input} /></label>
            <label className={label}>Email<input name="email" type="email" autoComplete="email" maxLength={254} defaultValue={settings.storeContact.email} className={input} /></label>
            <label className={label}>Địa chỉ<input name="address" autoComplete="street-address" maxLength={250} defaultValue={settings.storeContact.address} className={input} /></label>
            <label className={label}>Facebook URL<input name="facebookUrl" type="url" inputMode="url" placeholder="https://www.facebook.com/..." defaultValue={settings.storeContact.facebookUrl} className={input} /></label>
            <label className={label}>Instagram URL<input name="instagramUrl" type="url" inputMode="url" placeholder="https://www.instagram.com/..." defaultValue={settings.storeContact.instagramUrl} className={input} /></label>
            <label className={label}>Amazon URL<input name="amazonUrl" type="url" inputMode="url" placeholder="https://www.amazon.co.jp/..." defaultValue={settings.storeContact.amazonUrl} className={input} /></label>
          </div>
        </section>
      </fieldset>
      {readOnly ? <p className="mt-4 rounded-xl bg-[#fff8df] p-3 text-sm text-[#6d551d]">Bạn không có quyền thay đổi cài đặt.</p> : null}
      {message ? <p role="status" className={`mt-4 rounded-xl p-3 text-sm ${message.startsWith("Đã") ? "bg-[#e4f1df] text-[#365b35]" : "bg-[#fff0ed] text-[#8f201c]"}`}>{message}</p> : null}
      <button disabled={readOnly || pending} className="mt-5 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#8f201c] px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><Save size={16} />{pending ? "Đang lưu…" : "Lưu cài đặt"}</button>
    </form>
  );
}
