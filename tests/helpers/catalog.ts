import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { mutateCatalogDocument } from "@/lib/server/catalog-store";

export const testCatalogIds = {
  category: "10000000-0000-4000-8000-000000000001",
  firstProduct: "20000000-0000-4000-8000-000000000001",
  secondProduct: "20000000-0000-4000-8000-000000000002",
  firstImage: "30000000-0000-4000-8000-000000000001",
  secondImage: "30000000-0000-4000-8000-000000000002",
  firstVariant: "40000000-0000-4000-8000-000000000001",
  secondVariant: "40000000-0000-4000-8000-000000000002",
} as const;

export async function resetTestCatalog(name: string, populate = true): Promise<void> {
  process.env.CATALOG_BACKEND = "local-json";
  process.env.DEPLOYMENT_MODE = "demo";
  const filePath = path.join(tmpdir(), "moon-spice-tests", `catalog-${process.pid}-${name}.json`);
  process.env.CATALOG_LOCAL_PATH = filePath;
  await rm(filePath, { force: true });
  if (!populate) return;
  const timestamp = "2026-08-12T00:00:00.000Z";
  await mutateCatalogDocument((document) => {
    document.categories.push({ id: testCatalogIds.category, name: "イタリアンスパイス", slug: "italian-spice", description: "", imageUrl: "", imageAlt: "", sortOrder: 0, active: true, createdAt: timestamp, updatedAt: timestamp });
    document.products.push(
      { id: testCatalogIds.firstProduct, categoryId: testCatalogIds.category, name: "ガーリックハーブ", slug: "garlic-herb", shortDescription: "香り豊かなガーリックハーブミックス。", description: "パスタや肉料理に使える香り豊かなガーリックハーブミックスです。", ingredients: "", usage: "", storageInstructions: "", origin: "", manufacturer: "", distributor: "", shelfLife: "", allergenWarning: "", nutritionInfo: "", bestSeller: true, active: true, createdAt: timestamp, updatedAt: timestamp },
      { id: testCatalogIds.secondProduct, categoryId: testCatalogIds.category, name: "バジルミックス", slug: "basil-mix", shortDescription: "爽やかな香りのバジルスパイスミックス。", description: "サラダや野菜料理に使える爽やかなバジルスパイスミックスです。", ingredients: "", usage: "", storageInstructions: "", origin: "", manufacturer: "", distributor: "", shelfLife: "", allergenWarning: "", nutritionInfo: "", bestSeller: false, active: true, createdAt: "2026-08-13T00:00:00.000Z", updatedAt: "2026-08-13T00:00:00.000Z" },
    );
    document.productImages.push(
      { id: testCatalogIds.firstImage, productId: testCatalogIds.firstProduct, url: "/images/products/moor-spice-pouch.png", alt: "ガーリックハーブ", storageProvider: "LOCAL", blobPathname: null, role: "GALLERY", focalX: 50, focalY: 50, isPrimary: true, sortOrder: 0, createdAt: timestamp },
      { id: testCatalogIds.secondImage, productId: testCatalogIds.secondProduct, url: "/images/products/moor-spice-pouch.png", alt: "バジルミックス", storageProvider: "LOCAL", blobPathname: null, role: "GALLERY", focalX: 50, focalY: 50, isPrimary: true, sortOrder: 0, createdAt: timestamp },
    );
    document.productVariants.push(
      { id: testCatalogIds.firstVariant, productId: testCatalogIds.firstProduct, sku: "GARLIC-050", weightGrams: 50, price: 50_000, originalPrice: null, stock: 5, version: 1, active: true, createdAt: timestamp, updatedAt: timestamp },
      { id: testCatalogIds.secondVariant, productId: testCatalogIds.secondProduct, sku: "BASIL-050", weightGrams: 50, price: 80_000, originalPrice: null, stock: 3, version: 1, active: true, createdAt: timestamp, updatedAt: timestamp },
    );
    document.settings.heroProductId = testCatalogIds.firstProduct;
    document.settings.featuredProductId = testCatalogIds.firstProduct;
    document.settings.freeShippingThreshold = 100_000;
    document.settings.defaultShippingFee = 30_000;
  });
}
