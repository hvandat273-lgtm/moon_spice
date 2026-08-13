"use client";

import { ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { AdminCategoryItem, AdminProductDetail, AdminProductImageInput, AdminProductVariantInput, AdminUsageSuggestionInput } from "@/app/admin/_lib/types";

const emptyVariant = (): AdminProductVariantInput => ({ sku: "", weightGrams: 50, price: 0, originalPrice: null, stock: 0, active: true });

function slugify(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function ProductEditor({ categories, initial, readOnly }: { categories: AdminCategoryItem[]; initial?: AdminProductDetail; readOnly: boolean }) {
  const router = useRouter();
  const [variants, setVariants] = useState<AdminProductVariantInput[]>(initial?.variants.length ? initial.variants : [emptyVariant()]);
  const [images, setImages] = useState<AdminProductImageInput[]>(initial?.images ?? []);
  const [suggestions, setSuggestions] = useState<AdminUsageSuggestionInput[]>(initial?.suggestions ?? []);
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadedThisSession, setUploadedThisSession] = useState<Set<string>>(() => new Set());
  const [inventoryDrafts, setInventoryDrafts] = useState<Record<string, { delta: string; reason: string; pending?: boolean }>>({});
  const activeCategories = useMemo(() => categories.filter((category) => category.active || category.id === initial?.categoryId), [categories, initial?.categoryId]);

  function updateVariant(index: number, patch: Partial<AdminProductVariantInput>) {
    setVariants((current) => current.map((variant, itemIndex) => itemIndex === index ? { ...variant, ...patch } : variant));
  }

  async function adjustInventory(index: number) {
    const variant = variants[index];
    if (!variant.id || readOnly) return;
    const draft = inventoryDrafts[variant.id] ?? { delta: "", reason: "" };
    const delta = Number(draft.delta);
    if (!Number.isInteger(delta) || delta === 0 || draft.reason.trim().length < 3) {
      setMessage("Điều chỉnh tồn kho cần số lượng tăng/giảm khác 0 và lý do rõ ràng.");
      return;
    }
    setInventoryDrafts((current) => ({ ...current, [variant.id!]: { ...draft, pending: true } }));
    setMessage("");
    try {
      const response = await fetch("/api/admin/inventory", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ variantId: variant.id, delta, expectedVersion: variant.version ?? variant.expectedVersion, reason: draft.reason }) });
      const payload = await response.json() as { data?: { stock: number; version: number }; error?: { message?: string } | null };
      if (!response.ok || !payload.data) throw new Error(payload.error?.message ?? "Không thể điều chỉnh tồn kho");
      updateVariant(index, { stock: payload.data.stock, version: payload.data.version, expectedVersion: payload.data.version });
      setInventoryDrafts((current) => ({ ...current, [variant.id!]: { delta: "", reason: "" } }));
      setMessage("Đã điều chỉnh và lưu tồn kho.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể điều chỉnh tồn kho");
      setInventoryDrafts((current) => ({ ...current, [variant.id!]: { ...draft, pending: false } }));
    }
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length || readOnly) return;
    setUploading(true);
    setMessage("");
    try {
      const uploaded: AdminProductImageInput[] = [];
      for (const file of Array.from(files).slice(0, Math.max(0, 12 - images.length))) {
        const body = new FormData();
        body.set("file", file);
        const response = await fetch("/api/admin/uploads/images", { method: "POST", body });
        const payload = await response.json() as { data?: { url: string; pathname: string | null; storageProvider: "LOCAL" | "VERCEL_BLOB" }; error?: { message?: string } | null };
        if (!response.ok || !payload.data) throw new Error(payload.error?.message ?? `Không thể tải ${file.name}`);
        uploaded.push({
          id: crypto.randomUUID(),
          url: payload.data.url,
          blobPathname: payload.data.pathname,
          storageProvider: payload.data.storageProvider,
          alt: name ? `Ảnh sản phẩm ${name}` : "Ảnh sản phẩm Moon Spice",
          role: "GALLERY",
          focalX: 50,
          focalY: 50,
          isPrimary: images.length === 0 && uploaded.length === 0,
          sortOrder: images.length + uploaded.length,
        });
      }
      setUploadedThisSession((current) => {
        const next = new Set(current);
        for (const image of uploaded) if (image.blobPathname) next.add(image.blobPathname);
        return next;
      });
      setImages((current) => [...current, ...uploaded]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể tải ảnh");
    } finally {
      setUploading(false);
    }
  }

  function updateImageRole(index: number, role: AdminProductImageInput["role"]) {
    setImages((current) => current.map((image, itemIndex) => itemIndex === index ? {
      ...image,
      role,
      isPrimary: image.isPrimary && (role === "GALLERY" || role === "HERO_CUTOUT"),
    } : image));
    if (role !== "USAGE") {
      const imageId = images[index]?.id;
      if (imageId) setSuggestions((current) => current.filter((suggestion) => suggestion.productImageId !== imageId));
    }
  }

  function removeImage(index: number) {
    const removed = images[index];
    setImages((current) => current.filter((_, itemIndex) => itemIndex !== index).map((item, itemIndex) => ({ ...item, isPrimary: item.isPrimary || (itemIndex === 0 && removed.isPrimary), sortOrder: itemIndex })));
    if (removed.id) setSuggestions((current) => current.filter((suggestion) => suggestion.productImageId !== removed.id));
    if (removed.storageProvider === "VERCEL_BLOB" && removed.blobPathname && uploadedThisSession.has(removed.blobPathname)) {
      void fetch("/api/admin/uploads/images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathname: removed.blobPathname }),
      });
      setUploadedThisSession((current) => {
        const next = new Set(current);
        next.delete(removed.blobPathname!);
        return next;
      });
    }
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImages((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const reordered = [...current];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      return reordered.map((image, sortOrder) => ({ ...image, sortOrder }));
    });
  }

  function updateSuggestion(index: number, patch: Partial<AdminUsageSuggestionInput>) {
    setSuggestions((current) => current.map((suggestion, itemIndex) => itemIndex === index ? { ...suggestion, ...patch } : suggestion));
  }

  function moveSuggestion(index: number, direction: -1 | 1) {
    setSuggestions((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const reordered = [...current];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      return reordered.map((suggestion, sortOrder) => ({ ...suggestion, sortOrder }));
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    setMessage("");
    const text = (key: string) => String(form.get(key) ?? "");
    const payload = {
      expectedUpdatedAt: initial?.updatedAt,
      categoryId: text("categoryId"), name: name.trim(), slug: slug.trim(),
      shortDescription: text("shortDescription"), description: text("description"), ingredients: text("ingredients"), usage: text("usage"),
      storageInstructions: text("storageInstructions"), origin: text("origin"), manufacturer: text("manufacturer"), distributor: text("distributor"),
      shelfLife: text("shelfLife"), allergenWarning: text("allergenWarning"), nutritionInfo: text("nutritionInfo"),
      bestSeller: form.get("bestSeller") === "on", active: form.get("active") === "on",
      images,
      variants: variants.map((variant) => ({ ...variant, expectedVersion: variant.version ?? variant.expectedVersion, stockReason: variant.id ? "Cập nhật tồn kho từ biểu mẫu sản phẩm" : undefined })),
      suggestions,
    };
    try {
      const response = await fetch(initial ? `/api/admin/products/${initial.id}` : "/api/admin/products", {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { data?: { id?: string }; error?: { message?: string; fieldErrors?: unknown } | null };
      if (!response.ok) throw new Error(result.error?.message ?? "Không thể lưu sản phẩm");
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể lưu sản phẩm");
      setPending(false);
    }
  }

  const input = "mt-2 min-h-11 w-full rounded-xl border border-[#ded8ca] bg-white px-3 text-sm outline-none transition focus:border-[#5f6535] focus:ring-3 focus:ring-[#5f6535]/10 disabled:bg-[#f2eee6]";
  const label = "block text-sm font-semibold text-[#49463d]";

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <fieldset disabled={readOnly || pending} className="space-y-6 disabled:opacity-75">
        <section className="rounded-2xl border border-[#ded8ca] bg-[#fffdf8] p-5 md:p-6">
          <h2 className="font-display text-2xl">Thông tin cơ bản</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className={label}>Tên sản phẩm *<input className={input} name="name" required minLength={2} maxLength={160} value={name} onChange={(event) => { setName(event.target.value); if (!initial) setSlug(slugify(event.target.value)); }} /></label>
            <label className={label}>Slug *<input className={input} name="slug" required readOnly={Boolean(initial)} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={120} value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase())} /></label>
            <label className={label}>Danh mục *<select className={input} name="categoryId" required defaultValue={initial?.categoryId ?? activeCategories[0]?.id}>{activeCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <div className="flex items-end gap-5 pb-2">
              <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="active" defaultChecked={initial?.active ?? true} /> Đang bán</label>
              <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="bestSeller" defaultChecked={initial?.bestSeller ?? false} /> Bán chạy</label>
            </div>
          </div>
          <div className="mt-5 space-y-5">
            <label className={label}>Mô tả ngắn *<textarea className={`${input} min-h-24 py-3`} name="shortDescription" required minLength={10} maxLength={320} defaultValue={initial?.shortDescription} /></label>
            <label className={label}>Mô tả đầy đủ *<textarea className={`${input} min-h-40 py-3`} name="description" required minLength={20} maxLength={10000} defaultValue={initial?.description} /></label>
          </div>
        </section>

        <section className="rounded-2xl border border-[#ded8ca] bg-[#fffdf8] p-5 md:p-6">
          <div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-2xl">Biến thể & tồn kho</h2><p className="mt-1 text-xs text-[#716d61]">Mỗi khối lượng dùng một SKU riêng.</p></div><button type="button" onClick={() => setVariants((current) => [...current, emptyVariant()])} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#4b512b] px-3 text-xs font-bold text-[#4b512b]"><Plus size={15} /> Thêm dòng</button></div>
          <div className="mt-5 space-y-3">{variants.map((variant, index) => (
            <div key={variant.id ?? `new-${index}`} className="grid gap-3 rounded-xl border border-[#e5dfd3] bg-[#faf7f1] p-3 md:grid-cols-[1.2fr_.7fr_1fr_1fr_.7fr_auto] md:items-end">
              <label className={label}>SKU<input className={input} value={variant.sku} onChange={(event) => updateVariant(index, { sku: event.target.value.toUpperCase() })} required /></label>
              <label className={label}>Gram<input className={input} type="number" min={1} value={variant.weightGrams} onChange={(event) => updateVariant(index, { weightGrams: Number(event.target.value) })} required /></label>
              <label className={label}>Giá bán<input className={input} type="number" min={0} step={1000} value={variant.price} onChange={(event) => updateVariant(index, { price: Number(event.target.value) })} required /></label>
              <label className={label}>Giá gốc<input className={input} type="number" min={0} step={1000} value={variant.originalPrice ?? ""} onChange={(event) => updateVariant(index, { originalPrice: event.target.value ? Number(event.target.value) : null })} /></label>
              <label className={label}>Tồn kho<input className={input} type="number" min={0} value={variant.stock} readOnly={Boolean(variant.id)} onChange={(event) => updateVariant(index, { stock: Number(event.target.value) })} required /></label>
              <div className="flex items-center gap-2 pb-1"><label className="flex items-center gap-1.5 text-xs font-semibold"><input type="checkbox" checked={variant.active} onChange={(event) => updateVariant(index, { active: event.target.checked })} /> Bật</label>{variant.id ? <span className="text-[10px] text-[#858074]">Tắt để ngừng bán</span> : <button type="button" aria-label="Xóa dòng" disabled={variants.length === 1} onClick={() => setVariants((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="grid size-9 place-items-center rounded-lg text-[#8f201c] hover:bg-[#f7e9e6] disabled:opacity-30"><Trash2 size={15} /></button>}</div>
              {variant.id ? <div className="grid gap-2 border-t border-[#e1dacd] pt-3 md:col-span-6 md:grid-cols-[9rem_minmax(0,1fr)_auto]"><label className="text-xs font-bold">Tăng / giảm<input type="number" step={1} value={inventoryDrafts[variant.id]?.delta ?? ""} onChange={(event) => setInventoryDrafts((current) => ({ ...current, [variant.id!]: { ...(current[variant.id!] ?? { reason: "" }), delta: event.target.value } }))} className="mt-1 min-h-9 w-full rounded-lg border border-[#ded8ca] bg-white px-2" placeholder="+10 hoặc -2" /></label><label className="text-xs font-bold">Lý do<input value={inventoryDrafts[variant.id]?.reason ?? ""} onChange={(event) => setInventoryDrafts((current) => ({ ...current, [variant.id!]: { ...(current[variant.id!] ?? { delta: "" }), reason: event.target.value } }))} className="mt-1 min-h-9 w-full rounded-lg border border-[#ded8ca] bg-white px-2" placeholder="Nhập kho, kiểm kê, hư hỏng…" /></label><button type="button" onClick={() => void adjustInventory(index)} disabled={inventoryDrafts[variant.id]?.pending} className="min-h-9 self-end rounded-lg bg-[#4b512b] px-3 text-xs font-bold text-white">{inventoryDrafts[variant.id]?.pending ? "Đang lưu…" : "Điều chỉnh"}</button></div> : null}
            </div>
          ))}</div>
        </section>

        <section className="rounded-2xl border border-[#ded8ca] bg-[#fffdf8] p-5 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-2xl">Hình ảnh</h2><p className="mt-1 text-xs text-[#716d61]">JPEG, PNG, WebP hoặc AVIF; server chuyển sang WebP, tối đa 3 MiB. Hero cutout cần nền trong suốt thật.</p></div><label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#4b512b] px-3 text-xs font-bold text-[#4b512b]"><ImagePlus size={16} />{uploading ? "Đang tải…" : "Tải ảnh"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" onChange={(event) => void uploadFiles(event.target.files)} disabled={uploading} /></label></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{images.map((image, index) => {
            const linked = suggestions.some((suggestion) => suggestion.active && suggestion.productImageId === image.id);
            const primaryAllowed = image.role === "GALLERY" || image.role === "HERO_CUTOUT";
            return (
              <article key={image.id ?? image.url} className="overflow-hidden rounded-xl border border-[#e2dbce] bg-white">
                {image.role === "HERO_CUTOUT" ? <div className="grid grid-cols-2" aria-label="Xem trước cutout trên nền cream và olive"><div className="relative aspect-[4/3] bg-[#eee9df]"><Image src={image.url} alt={image.alt} fill sizes="160px" unoptimized className="object-contain" style={{ objectPosition: `${image.focalX}% ${image.focalY}%` }} /></div><div className="relative aspect-[4/3] bg-[#4b512b]"><Image src={image.url} alt="" fill sizes="160px" unoptimized className="object-contain" style={{ objectPosition: `${image.focalX}% ${image.focalY}%` }} /></div></div> : <div className="relative aspect-[4/3] bg-[#eee9df]"><Image src={image.url} alt={image.alt} fill sizes="(max-width: 768px) 100vw, 320px" unoptimized className="object-contain" style={{ objectPosition: `${image.focalX}% ${image.focalY}%` }} /></div>}
                <div className="space-y-3 p-3">
                  <input value={image.alt} onChange={(event) => setImages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, alt: event.target.value } : item))} className="min-h-9 w-full rounded-lg border border-[#ded8ca] px-2 text-xs" placeholder="Alt text" />
                  <label className="block text-[10px] font-bold tracking-wide uppercase">Vai trò
                    <select value={image.role} disabled={linked} onChange={(event) => updateImageRole(index, event.target.value as AdminProductImageInput["role"])} className="mt-1 min-h-9 w-full rounded-lg border border-[#ded8ca] bg-white px-2 text-xs">
                      <option value="GALLERY">Gallery</option><option value="HERO_CUTOUT">Hero cutout</option><option value="HERO_BACKGROUND">Hero background</option><option value="HERO_BACKGROUND_MOBILE">Hero mobile</option><option value="FEATURED_BACKGROUND">Featured background</option><option value="FEATURED_BACKGROUND_MOBILE">Featured mobile</option><option value="INGREDIENT_SHOWCASE">Ingredient showcase</option><option value="USAGE">Usage suggestion</option>
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-2"><label className="text-[10px] font-bold uppercase">Focal X<input type="number" min={0} max={100} value={image.focalX} onChange={(event) => setImages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, focalX: Number(event.target.value) } : item))} className="mt-1 min-h-9 w-full rounded-lg border border-[#ded8ca] px-2 text-xs" /></label><label className="text-[10px] font-bold uppercase">Focal Y<input type="number" min={0} max={100} value={image.focalY} onChange={(event) => setImages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, focalY: Number(event.target.value) } : item))} className="mt-1 min-h-9 w-full rounded-lg border border-[#ded8ca] px-2 text-xs" /></label></div>
                  <div className="flex items-center justify-between gap-2"><label className={`flex items-center gap-1.5 text-xs font-semibold ${primaryAllowed ? "" : "opacity-45"}`}><input type="radio" name="primaryImage" disabled={!primaryAllowed} checked={image.isPrimary} onChange={() => setImages((current) => current.map((item, itemIndex) => ({ ...item, isPrimary: itemIndex === index })))} /> Ảnh chính</label><div className="flex items-center gap-1"><button type="button" aria-label="Đưa ảnh lên" disabled={index === 0} onClick={() => moveImage(index, -1)} className="grid size-8 place-items-center rounded-lg border border-[#ded8ca] disabled:opacity-30">↑</button><button type="button" aria-label="Đưa ảnh xuống" disabled={index === images.length - 1} onClick={() => moveImage(index, 1)} className="grid size-8 place-items-center rounded-lg border border-[#ded8ca] disabled:opacity-30">↓</button><button type="button" aria-label="Xóa ảnh" onClick={() => removeImage(index)} className="grid size-8 place-items-center rounded-lg text-[#8f201c]"><Trash2 size={15} /></button></div></div>
                </div>
              </article>
            );
          })}{!images.length ? <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-[#ccc3b3] text-center text-xs text-[#858074] sm:col-span-2 lg:col-span-3">Chưa có ảnh sản phẩm</div> : null}</div>
        </section>

        <section className="rounded-2xl border border-[#ded8ca] bg-[#fffdf8] p-5 md:p-6">
          <div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-2xl">Gợi ý cách sử dụng</h2><p className="mt-1 text-xs text-[#716d61]">Tối đa 4 gợi ý; mỗi gợi ý phải gắn với ảnh có vai trò Usage.</p></div><button type="button" disabled={suggestions.length >= 4 || !images.some((image) => image.role === "USAGE" && image.id)} onClick={() => { const usageImage = images.find((image) => image.role === "USAGE" && image.id); if (usageImage?.id) setSuggestions((current) => [...current, { productImageId: usageImage.id!, title: "", description: "", sortOrder: current.length, active: true }]); }} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#4b512b] px-3 text-xs font-bold text-[#4b512b] disabled:opacity-40"><Plus size={15} /> Thêm gợi ý</button></div>
          <div className="mt-5 space-y-3">{suggestions.map((suggestion, index) => (
            <div key={suggestion.id ?? `suggestion-${index}`} className="grid gap-3 rounded-xl border border-[#e5dfd3] bg-[#faf7f1] p-3 md:grid-cols-[1fr_1fr_1.4fr_.5fr_auto] md:items-end">
              <label className={label}>Ảnh<select value={suggestion.productImageId} onChange={(event) => updateSuggestion(index, { productImageId: event.target.value })} className={input}>{images.filter((image) => image.role === "USAGE" && image.id).map((image, imageIndex) => <option key={image.id} value={image.id}>{image.alt || `Ảnh usage ${imageIndex + 1}`}</option>)}</select></label>
              <label className={label}>Tiêu đề<input value={suggestion.title} onChange={(event) => updateSuggestion(index, { title: event.target.value })} className={input} maxLength={80} required /></label>
              <label className={label}>Mô tả<input value={suggestion.description ?? ""} onChange={(event) => updateSuggestion(index, { description: event.target.value })} className={input} maxLength={200} /></label>
              <label className={label}>Thứ tự<input type="number" min={0} value={suggestion.sortOrder} onChange={(event) => updateSuggestion(index, { sortOrder: Number(event.target.value) })} className={input} /></label>
              <div className="flex items-center gap-1 pb-1"><label className="mr-1 flex items-center gap-1.5 text-xs font-semibold"><input type="checkbox" checked={suggestion.active} onChange={(event) => updateSuggestion(index, { active: event.target.checked })} /> Bật</label><button type="button" aria-label="Đưa gợi ý lên" disabled={index === 0} onClick={() => moveSuggestion(index, -1)} className="grid size-8 place-items-center rounded-lg border border-[#ded8ca] disabled:opacity-30">↑</button><button type="button" aria-label="Đưa gợi ý xuống" disabled={index === suggestions.length - 1} onClick={() => moveSuggestion(index, 1)} className="grid size-8 place-items-center rounded-lg border border-[#ded8ca] disabled:opacity-30">↓</button><button type="button" aria-label="Xóa gợi ý" onClick={() => setSuggestions((current) => current.filter((_, itemIndex) => itemIndex !== index).map((item, sortOrder) => ({ ...item, sortOrder })))} className="grid size-8 place-items-center rounded-lg text-[#8f201c]"><Trash2 size={15} /></button></div>
            </div>
          ))}{!suggestions.length ? <p className="rounded-xl border border-dashed border-[#ccc3b3] p-5 text-center text-xs text-[#858074]">Đổi ít nhất một ảnh sang vai trò Usage để thêm gợi ý.</p> : null}</div>
        </section>

        <section className="rounded-2xl border border-[#ded8ca] bg-[#fffdf8] p-5 md:p-6">
          <h2 className="font-display text-2xl">Nội dung chi tiết</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className={label}>Thành phần<textarea className={`${input} min-h-28 py-3`} name="ingredients" defaultValue={initial?.ingredients} /></label>
            <label className={label}>Hướng dẫn sử dụng<textarea className={`${input} min-h-28 py-3`} name="usage" defaultValue={initial?.usage} /></label>
            <label className={label}>Bảo quản<textarea className={`${input} min-h-24 py-3`} name="storageInstructions" defaultValue={initial?.storageInstructions} /></label>
            <label className={label}>Cảnh báo dị ứng<textarea className={`${input} min-h-24 py-3`} name="allergenWarning" defaultValue={initial?.allergenWarning} /></label>
            <label className={label}>Xuất xứ<input className={input} name="origin" defaultValue={initial?.origin} /></label><label className={label}>Hạn sử dụng<input className={input} name="shelfLife" defaultValue={initial?.shelfLife} /></label>
            <label className={label}>Nhà sản xuất<input className={input} name="manufacturer" defaultValue={initial?.manufacturer} /></label><label className={label}>Nhà phân phối<input className={input} name="distributor" defaultValue={initial?.distributor} /></label>
            <label className={`${label} md:col-span-2`}>Thông tin dinh dưỡng<textarea className={`${input} min-h-28 py-3`} name="nutritionInfo" defaultValue={initial?.nutritionInfo} /></label>
          </div>
        </section>
      </fieldset>

      <aside className="xl:sticky xl:top-0 xl:self-start">
        <div className="rounded-2xl border border-[#ded8ca] bg-[#fffdf8] p-5 shadow-[0_12px_30px_rgb(50_43_28/6%)]">
          <h2 className="font-display text-xl">{initial ? "Cập nhật sản phẩm" : "Tạo sản phẩm"}</h2>
          <p className="mt-2 text-sm text-[#716d61]">Kiểm tra SKU, giá và tồn kho trước khi lưu.</p>
          {readOnly ? <p className="mt-4 rounded-xl bg-[#fff4d6] p-3 text-xs font-semibold text-[#755817]">Bạn không có quyền thay đổi sản phẩm.</p> : null}
          {message ? <p role="alert" className="mt-4 rounded-xl bg-[#fff0ed] p-3 text-sm text-[#8f201c]">{message}</p> : null}
          <button disabled={readOnly || pending || uploading} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#8f201c] px-4 text-sm font-bold text-white disabled:opacity-50"><Save size={16} />{pending ? "Đang lưu…" : "Lưu sản phẩm"}</button>
          <button type="button" onClick={() => router.back()} className="mt-2 min-h-11 w-full rounded-xl border border-[#ded8ca] text-sm font-semibold">Quay lại</button>
        </div>
      </aside>
    </form>
  );
}
