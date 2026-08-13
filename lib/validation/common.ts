import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const canonicalUuidV4Schema = z
  .string()
  .uuid()
  .refine((value) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value), {
    message: "Phải là UUIDv4 hợp lệ",
  });

export function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeVietnamPhone(value: string): string {
  const compact = value.trim().replace(/[\s().-]/g, "");
  const digits = compact.replace(/^\+/, "").replace(/\D/g, "");
  if (digits.startsWith("84")) return `+${digits}`;
  if (digits.startsWith("0")) return `+84${digits.slice(1)}`;
  return `+84${digits}`;
}

export const vietnamPhoneSchema = z
  .string()
  .trim()
  .min(9)
  .max(24)
  .refine(
    (value) => /^\+?[0-9\s().-]+$/.test(value) && /^\+84\d{8,10}$/.test(normalizeVietnamPhone(value)),
    "Số điện thoại Việt Nam không hợp lệ",
  );

export function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
}
