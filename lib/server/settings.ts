import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { getDatabase } from "@/db/client";
import { siteSettings } from "@/db/schema";
import { parseSetting, type SettingKey } from "@/lib/validation/settings";

import { getCatalogBackend, readCatalogDocument, type CatalogSettingsRecord } from "./catalog-store";
import { assertProductionEnvironment } from "./env";

function initialStoreContact() {
  return Object.fromEntries(
    [
      ["phone", process.env.INITIAL_STORE_PHONE],
      ["email", process.env.INITIAL_STORE_EMAIL],
      ["address", process.env.INITIAL_STORE_ADDRESS],
      ["facebookUrl", process.env.INITIAL_STORE_FACEBOOK_URL],
      ["instagramUrl", process.env.INITIAL_STORE_INSTAGRAM_URL],
      ["amazonUrl", process.env.INITIAL_STORE_AMAZON_URL],
    ].filter((entry): entry is [string, string] => Boolean(entry[1]?.trim())).map(([key, value]) => [key, value.trim()]),
  );
}

const bootstrapValues: Record<SettingKey, unknown> = {
  hero_product_id: null,
  featured_product_id: null,
  homepage_best_seller_limit: 8,
  free_shipping_threshold: 0,
  default_shipping_fee: 0,
  pending_order_expiry_hours: 24,
  order_pii_retention_days: 30,
  order_asset_retention_days: 30,
  store_contact: initialStoreContact(),
  announcement_text: "MOOR SPICE 公式カタログ",
};

const documentSettingKeys: Record<SettingKey, keyof CatalogSettingsRecord> = {
  hero_product_id: "heroProductId",
  featured_product_id: "featuredProductId",
  homepage_best_seller_limit: "homepageBestSellerLimit",
  free_shipping_threshold: "freeShippingThreshold",
  default_shipping_fee: "defaultShippingFee",
  pending_order_expiry_hours: "pendingOrderExpiryHours",
  order_pii_retention_days: "orderPiiRetentionDays",
  order_asset_retention_days: "orderAssetRetentionDays",
  store_contact: "storeContact",
  announcement_text: "announcementText",
};

async function readDatabaseSetting(key: SettingKey): Promise<unknown> {
  const [record] = await getDatabase().select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
  return parseSetting(key, record?.value ?? bootstrapValues[key]);
}

const readCachedDatabaseSetting = unstable_cache(readDatabaseSetting, ["moon-spice-site-settings-v2"], {
  tags: ["site-settings"],
  revalidate: 60,
});

export async function getSiteSetting<K extends SettingKey>(key: K): Promise<ReturnType<typeof parseSetting<K>>> {
  assertProductionEnvironment();
  const value = getCatalogBackend() === "postgres"
    ? await (process.env.NODE_ENV === "test" ? readDatabaseSetting(key) : readCachedDatabaseSetting(key))
    : (await readCatalogDocument()).settings[documentSettingKeys[key]];
  return parseSetting(key, value) as ReturnType<typeof parseSetting<K>>;
}
