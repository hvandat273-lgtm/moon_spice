"use client";

import Image from "next/image";
import { ImagePlus, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AdminCategoryItem } from "@/app/admin/_lib/types";
import { ActiveBadge, adminTableClass, TableFrame } from "./AdminUi";

type Draft = Omit<AdminCategoryItem, "id" | "productCount" | "updatedAt"> & { updatedAt?: string };
type UploadedCategoryImage = Pick<Draft, "imageUrl" | "imageStorageProvider" | "imageBlobPathname">;

const emptyDraft: Draft = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  imageAlt: "",
  imageStorageProvider: null,
  imageBlobPathname: null,
  sortOrder: 0,
  active: true,
};

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function discardUnattachedBlob(pathname: string | null | undefined): Promise<void> {
  if (!pathname) return;
  await fetch("/api/admin/uploads/images", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pathname }),
  }).catch(() => undefined);
}

export function CategoryManager({ categories, readOnly }: { categories: AdminCategoryItem[]; readOnly: boolean }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function save(event: React.FormEvent<HTMLFormElement>, id?: string) {
    event.preventDefault();
    if (readOnly) return;
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      expectedUpdatedAt: String(form.get("expectedUpdatedAt") ?? "") || undefined,
      name: String(form.get("name")),
      slug: String(form.get("slug")),
      description: String(form.get("description")),
      imageUrl: String(form.get("imageUrl")),
      imageStorageProvider: String(form.get("imageStorageProvider") ?? "") || null,
      imageBlobPathname: String(form.get("imageBlobPathname") ?? "") || null,
      imageAlt: String(form.get("imageAlt")),
      sortOrder: Number(form.get("sortOrder")),
      active: form.get("active") === "on",
    };
    try {
      const response = await fetch(id ? `/api/admin/categories/${id}` : "/api/admin/categories", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { error?: { message?: string } | null };
      if (!response.ok) throw new Error(result.error?.message ?? "Không thể lưu danh mục");
      setCreating(false);
      setEditing(null);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể lưu danh mục");
    } finally {
      setPending(false);
    }
  }

  async function deactivate(category: AdminCategoryItem) {
    if (readOnly || !window.confirm(category.productCount ? "Danh mục đang có sản phẩm. Chỉ ẩn danh mục và giữ nguyên dữ liệu. Tiếp tục?" : "Ẩn danh mục này?")) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedUpdatedAt: category.updatedAt }),
      });
      const result = await response.json() as { error?: { message?: string } | null };
      if (!response.ok) throw new Error(result.error?.message ?? "Không thể ẩn danh mục");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể ẩn danh mục");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end"><button disabled={readOnly} onClick={() => setCreating(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#8f201c] px-4 text-sm font-bold text-white disabled:opacity-50"><Plus size={16} /> Thêm danh mục</button></div>
      {readOnly ? <p className="mb-4 rounded-xl border border-[#ead9a9] bg-[#fff8df] p-3 text-sm text-[#6d551d]">Bạn không có quyền thay đổi danh mục.</p> : null}
      {error ? <p role="alert" className="mb-4 rounded-xl bg-[#fff0ed] p-3 text-sm text-[#8f201c]">{error}</p> : null}
      {creating ? <CategoryForm initial={emptyDraft} pending={pending} onCancel={() => setCreating(false)} onSubmit={(event) => void save(event)} /> : null}
      <TableFrame><table className={adminTableClass}><thead><tr><th>Danh mục</th><th>Slug</th><th>Sản phẩm</th><th>Thứ tự</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{categories.map((category) => editing === category.id ? (
        <tr key={category.id}><td colSpan={6}><CategoryForm initial={category} pending={pending} onCancel={() => setEditing(null)} onSubmit={(event) => void save(event, category.id)} /></td></tr>
      ) : (
        <tr key={category.id}><td><span className="font-semibold">{category.name}</span><span className="mt-0.5 block max-w-sm text-xs text-[#858074]">{category.description}</span></td><td className="font-mono text-xs">/{category.slug}</td><td>{category.productCount}</td><td>{category.sortOrder}</td><td><ActiveBadge active={category.active} /></td><td><div className="flex gap-2"><button disabled={readOnly} onClick={() => setEditing(category.id)} className="grid size-9 place-items-center rounded-lg border border-[#ded8ca] text-[#4b512b] disabled:opacity-40" aria-label={`Sửa ${category.name}`}><Pencil size={15} /></button>{category.active ? <button disabled={readOnly || pending} onClick={() => void deactivate(category)} className="grid size-9 place-items-center rounded-lg border border-[#e2cdc8] text-[#8f201c] disabled:opacity-40" aria-label={`Ẩn ${category.name}`}><X size={15} /></button> : null}</div></td></tr>
      ))}</tbody></table></TableFrame>
    </>
  );
}

function CategoryForm({ initial, pending, onCancel, onSubmit }: { initial: Draft | AdminCategoryItem; pending: boolean; onCancel: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [image, setImage] = useState<UploadedCategoryImage>({ imageUrl: initial.imageUrl, imageStorageProvider: initial.imageStorageProvider, imageBlobPathname: initial.imageBlobPathname });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const input = "min-h-10 w-full rounded-lg border border-[#ded8ca] bg-white px-2.5 text-sm";

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/admin/uploads/images", { method: "POST", body });
      const result = await response.json() as { data?: { url: string; pathname: string | null; storageProvider: "LOCAL" | "VERCEL_BLOB" }; error?: { message?: string } | null };
      if (!response.ok || !result.data) throw new Error(result.error?.message ?? "Không thể tải ảnh danh mục");
      const previous = image.imageBlobPathname;
      setImage({ imageUrl: result.data.url, imageStorageProvider: result.data.storageProvider, imageBlobPathname: result.data.pathname });
      if (previous && previous !== initial.imageBlobPathname) await discardUnattachedBlob(previous);
    } catch (cause) {
      setUploadError(cause instanceof Error ? cause.message : "Không thể tải ảnh danh mục");
    } finally {
      setUploading(false);
    }
  }

  async function clearImage() {
    const pathname = image.imageBlobPathname;
    setImage({ imageUrl: "", imageStorageProvider: null, imageBlobPathname: null });
    if (pathname && pathname !== initial.imageBlobPathname) await discardUnattachedBlob(pathname);
  }

  async function cancel() {
    if (image.imageBlobPathname && image.imageBlobPathname !== initial.imageBlobPathname) await discardUnattachedBlob(image.imageBlobPathname);
    onCancel();
  }

  return (
    <form onSubmit={onSubmit} className="mb-4 grid gap-3 rounded-2xl border border-[#cfd4b7] bg-[#f7f8ef] p-4 md:grid-cols-2 xl:grid-cols-4">
      <input type="hidden" name="expectedUpdatedAt" value={initial.updatedAt ?? ""} />
      <input type="hidden" name="imageUrl" value={image.imageUrl} />
      <input type="hidden" name="imageStorageProvider" value={image.imageStorageProvider ?? ""} />
      <input type="hidden" name="imageBlobPathname" value={image.imageBlobPathname ?? ""} />
      <label className="text-xs font-bold">Tên<input name="name" required value={name} onChange={(event) => { setName(event.target.value); if (!("id" in initial)) setSlug(slugify(event.target.value)); }} className={`mt-1 ${input}`} /></label>
      <label className="text-xs font-bold">Slug<input name="slug" required value={slug} readOnly={"id" in initial} onChange={(event) => setSlug(event.target.value)} className={`mt-1 ${input}`} /></label>
      <label className="text-xs font-bold">Thứ tự<input name="sortOrder" type="number" min={0} defaultValue={initial.sortOrder} className={`mt-1 ${input}`} /></label>
      <label className="flex items-end gap-2 pb-2 text-xs font-bold"><input name="active" type="checkbox" defaultChecked={initial.active} /> Đang hoạt động</label>
      <label className="text-xs font-bold md:col-span-2">Mô tả<input name="description" defaultValue={initial.description} className={`mt-1 ${input}`} /></label>
      <label className="text-xs font-bold">Alt ảnh<input name="imageAlt" defaultValue={initial.imageAlt} required={Boolean(image.imageUrl)} className={`mt-1 ${input}`} /></label>
      <div className="text-xs font-bold">
        Ảnh danh mục
        <div className="mt-1 flex min-h-10 items-center gap-2">
          <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#4b512b] bg-white px-3 text-[#4b512b]"><ImagePlus size={15} /> {uploading ? "Đang tải…" : "Tải ảnh"}<input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading || pending} onChange={(event) => void upload(event.target.files?.[0])} /></label>
          {image.imageUrl ? <button type="button" aria-label="Gỡ ảnh danh mục" onClick={() => void clearImage()} className="grid size-10 place-items-center rounded-lg border border-[#e2cdc8] text-[#8f201c]"><Trash2 size={15} /></button> : null}
        </div>
      </div>
      {image.imageUrl ? <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-[#ded8ca] bg-white md:col-span-2 xl:col-span-4"><Image src={image.imageUrl} alt={initial.imageAlt || name || "Ảnh danh mục"} fill unoptimized sizes="480px" className="object-cover" /></div> : null}
      {uploadError ? <p role="alert" className="text-xs text-[#8f201c] md:col-span-2 xl:col-span-4">{uploadError}</p> : null}
      <div className="flex gap-2 md:col-span-2 xl:col-span-4"><button disabled={pending || uploading} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#4b512b] px-4 text-xs font-bold text-white disabled:opacity-50"><Save size={14} /> Lưu</button><button type="button" onClick={() => void cancel()} className="min-h-10 rounded-lg border border-[#ded8ca] bg-white px-4 text-xs font-bold">Hủy</button></div>
    </form>
  );
}
