"use client";

import { Power, PowerOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

async function apiMutation(url: string, method: string, body?: unknown): Promise<void> {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null) as { error?: { message?: string } | null } | null;
  if (!response.ok) throw new Error(payload?.error?.message ?? "Không thể lưu thay đổi");
}

export function ProductDeactivateButton({ id, active, updatedAt }: { id: string; active: boolean; updatedAt: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (active && !window.confirm("Ẩn sản phẩm này khỏi catalog?")) return;
    setPending(true);
    try {
      await apiMutation(
        `/api/admin/products/${id}`,
        active ? "DELETE" : "PATCH",
        active ? { expectedUpdatedAt: updatedAt } : { operation: "activate", expectedUpdatedAt: updatedAt },
      );
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Không thể cập nhật sản phẩm");
    } finally {
      setPending(false);
    }
  }

  const Icon = active ? PowerOff : Power;
  return <button type="button" onClick={toggle} disabled={pending} aria-label={active ? "Ẩn sản phẩm" : "Kích hoạt sản phẩm"} title={active ? "Ẩn sản phẩm" : "Kích hoạt sản phẩm"} className="grid size-9 place-items-center rounded-lg border border-[#ded8ca] bg-white text-[#8f201c] hover:border-[#8f201c] disabled:opacity-50"><Icon size={15} /></button>;
}
