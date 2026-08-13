"use client";

import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const payload = await response.json() as { error?: { message?: string } | null };
      if (!response.ok) throw new Error(payload.error?.message ?? "Không thể đăng nhập");
      const target = searchParams.get("next");
      router.replace(target?.startsWith("/admin") && !target.startsWith("//") ? target : "/admin");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể đăng nhập");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <label className="block">
        <span className="mb-2 block text-xs font-bold tracking-wide text-[#49463d] uppercase">Email quản trị</span>
        <span className="relative block">
          <Mail size={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#8c8578]" />
          <input name="email" type="email" autoComplete="username" required maxLength={254} className="min-h-12 w-full rounded-xl border border-[#ded5c4] bg-white pr-4 pl-10 text-sm outline-none transition focus:border-[#5f6535] focus:ring-3 focus:ring-[#5f6535]/10" placeholder="admin@moonspice.vn" />
        </span>
      </label>
      <label className="block">
        <span className="mb-2 block text-xs font-bold tracking-wide text-[#49463d] uppercase">Mật khẩu</span>
        <span className="relative block">
          <LockKeyhole size={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#8c8578]" />
          <input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required minLength={1} maxLength={72} aria-describedby="admin-password-requirement" className="min-h-12 w-full rounded-xl border border-[#ded5c4] bg-white pr-12 pl-10 text-sm outline-none transition focus:border-[#5f6535] focus:ring-3 focus:ring-[#5f6535]/10" placeholder="••••••••••••" />
          <button type="button" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShowPassword((value) => !value)} className="absolute top-1/2 right-2.5 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-[#777064] hover:bg-[#f2eee5]">
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </span>
        <span id="admin-password-requirement" className="mt-1.5 block text-xs text-[#716d61]">12–72 byte UTF-8</span>
      </label>
      {error ? <p role="alert" className="rounded-xl border border-[#efcac5] bg-[#fff1ee] px-3.5 py-3 text-sm font-medium text-[#8f201c]">{error}</p> : null}
      <button disabled={pending} className="min-h-12 w-full rounded-xl bg-[#8f201c] px-5 text-sm font-bold tracking-wide text-white shadow-lg shadow-[#8f201c]/15 transition hover:bg-[#711713] disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? "Đang xác thực…" : "Đăng nhập an toàn"}
      </button>
    </form>
  );
}
