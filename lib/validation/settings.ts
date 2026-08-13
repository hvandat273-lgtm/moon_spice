import { z } from "zod";

const optionalHttpsUrl = z.union([
  z.literal(""),
  z.string().trim().url().max(2048).refine((value) => new URL(value).protocol === "https:", "URL phải dùng HTTPS"),
]).optional();

export const settingSchemas = {
  hero_product_id: z.string().uuid().nullable(),
  featured_product_id: z.string().uuid().nullable(),
  homepage_best_seller_limit: z.number().int().min(1).max(12),
  free_shipping_threshold: z.number().int().min(0).max(1_000_000_000),
  default_shipping_fee: z.number().int().min(0).max(1_000_000_000),
  pending_order_expiry_hours: z.number().int().min(1).max(168),
  order_pii_retention_days: z.number().int().min(30).max(3650),
  order_asset_retention_days: z.number().int().min(30).max(3650),
  store_contact: z
    .object({
      phone: z.string().trim().max(24).optional(),
      email: z.string().trim().email().max(254).optional(),
      address: z.string().trim().max(250).optional(),
      facebookUrl: optionalHttpsUrl,
      instagramUrl: optionalHttpsUrl,
      amazonUrl: optionalHttpsUrl,
    })
    .strict(),
  announcement_text: z.string().trim().max(160),
} as const;

export type SettingKey = keyof typeof settingSchemas;

export function parseSetting<K extends SettingKey>(key: K, value: unknown): z.infer<(typeof settingSchemas)[K]> {
  return settingSchemas[key].parse(value) as z.infer<(typeof settingSchemas)[K]>;
}
