import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ document: null as import("@/lib/server/catalog-store").CatalogDocument | null }));
const databaseMock = vi.hoisted(() => vi.fn(() => { throw new Error("PostgreSQL must not be used by JSON catalog admin"); }));
const cleanupMock = vi.hoisted(() => vi.fn(async () => ({ deleted: [], referenced: [] })));

vi.mock("@/db/client", () => ({ getDatabase: databaseMock, hasDatabaseUrl: () => false }));
vi.mock("@/lib/server/uploads", () => ({ deleteUnreferencedCatalogBlobImages: cleanupMock }));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: <T extends (...args: never[]) => unknown>(callback: T) => callback,
}));
vi.mock("@/lib/server/env", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/server/env")>()),
  getDeploymentMode: () => "demo" as const,
  usesJsonCatalogBackend: () => true,
  usesPostgresCatalogBackend: () => false,
}));
vi.mock("@/lib/server/catalog-store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/server/catalog-store")>();
  return {
    ...actual,
    readCatalogDocument: async () => structuredClone(state.document ?? actual.emptyCatalogDocument()),
    mutateCatalogDocument: async <T,>(mutation: (draft: import("@/lib/server/catalog-store").CatalogDocument) => T | Promise<T>) => {
      const source = structuredClone(state.document ?? actual.emptyCatalogDocument());
      const draft = structuredClone(source);
      const result = await mutation(draft);
      draft.revision += 1;
      draft.updatedAt = new Date().toISOString();
      state.document = actual.parseCatalogDocument(draft);
      return { document: structuredClone(state.document), result };
    },
  };
});

import { readAdminCategories, readAdminDashboard, readAdminProduct, readAdminProducts, readAdminSettings } from "@/app/admin/_lib/data";
import { deactivateProduct, saveCategory, saveProduct, updateInventory, updateSiteSettings } from "@/lib/server/admin";
import { emptyCatalogDocument } from "@/lib/server/catalog-store";

const actor = { adminId: "env-admin", requestId: "json-admin-test" };

describe("JSON catalog admin", () => {
  beforeEach(() => {
    state.document = emptyCatalogDocument();
    databaseMock.mockClear();
    cleanupMock.mockClear();
    process.env.STORAGE_ADAPTER = "local";
  });

  it("creates and reads real category/product records, settings and inventory without PostgreSQL", async () => {
    const category = await saveCategory({
      name: "Italian Spice", slug: "italian-spice", description: "Danh mục chính",
      imageUrl: "/images/category.webp", imageStorageProvider: "LOCAL", imageAlt: "Italian Spice",
      sortOrder: 0, active: true,
    }, actor);
    const imageId = "00000000-0000-4000-8000-000000000031";
    const product = await saveProduct({
      categoryId: category.id,
      name: "Italian Herb Spice",
      slug: "italian-herb-spice",
      shortDescription: "Hỗn hợp thảo mộc cho món Ý.",
      description: "Hỗn hợp thảo mộc và tỏi dùng cho pasta cùng các món nướng.",
      ingredients: "Basil, oregano, rosemary",
      usage: "Rắc trực tiếp lên món ăn",
      storageInstructions: "Bảo quản nơi khô ráo",
      origin: "Việt Nam",
      manufacturer: "Moon Spice",
      distributor: "Moon Spice",
      shelfLife: "12 tháng",
      allergenWarning: null,
      nutritionInfo: null,
      bestSeller: true,
      active: true,
      images: [{ id: imageId, url: "/images/product.webp", alt: "Túi gia vị", storageProvider: "LOCAL", blobPathname: null, role: "GALLERY", focalX: 50, focalY: 50, isPrimary: true, sortOrder: 0 }],
      variants: [{ sku: "ITL-050", weightGrams: 50, price: 79_000, originalPrice: null, stock: 12, active: true }],
      suggestions: [],
    }, actor);

    expect((await readAdminCategories())[0]).toMatchObject({ id: category.id, productCount: 1 });
    expect((await readAdminProducts()).items[0]).toMatchObject({ id: product.id, minimumPrice: 79_000, totalStock: 12 });
    expect(await readAdminProduct(product.id)).toMatchObject({ id: product.id, variants: [{ stock: 12, version: 1 }] });
    expect(await readAdminDashboard()).toMatchObject({ productCount: 1, lowStockCount: 0 });

    const variant = state.document!.productVariants[0];
    const adjusted = await updateInventory({ variantId: variant.id, delta: -2, expectedVersion: 1, reason: "Kiểm kê thực tế", ...actor });
    expect(adjusted).toMatchObject({ stock: 10, version: 2 });

    await updateSiteSettings([
      ["hero_product_id", product.id], ["featured_product_id", product.id], ["homepage_best_seller_limit", 8],
      ["free_shipping_threshold", 500_000], ["default_shipping_fee", 30_000], ["pending_order_expiry_hours", 48],
      ["order_pii_retention_days", 730], ["order_asset_retention_days", 730], ["announcement_text", "送料無料"],
      ["store_contact", { email: "hello@example.com", facebookUrl: "https://facebook.com/moorspice" }],
    ], actor.adminId, actor.requestId, state.document!.revision);
    expect(await readAdminSettings()).toMatchObject({ heroProductId: product.id, storeContact: { email: "hello@example.com" } });

    await deactivateProduct(product.id, { ...actor, expectedUpdatedAt: state.document!.products[0].updatedAt });
    expect((await readAdminProduct(product.id))?.active).toBe(false);
    expect(databaseMock).not.toHaveBeenCalled();
  });

  it("rejects stale product, category and settings full-form writes", async () => {
    const category = await saveCategory({
      name: "Italian Spice", slug: "italian-spice", description: "Danh mục chính", imageUrl: "", imageAlt: "", sortOrder: 0, active: false,
    }, actor);
    const categoryUpdatedAt = state.document!.categories[0].updatedAt;
    await saveCategory({ id: category.id, expectedUpdatedAt: categoryUpdatedAt, name: "Italian Spice mới", slug: category.slug, description: "Mới", imageUrl: "", imageAlt: "", sortOrder: 1, active: false }, actor);
    await expect(saveCategory({ id: category.id, expectedUpdatedAt: categoryUpdatedAt, name: "Ghi đè cũ", slug: category.slug, description: "Cũ", imageUrl: "", imageAlt: "", sortOrder: 2, active: false }, actor))
      .rejects.toMatchObject({ status: 409, code: "STALE_CATALOG_WRITE" });

    const product = await saveProduct({
      categoryId: category.id, name: "Italian Herb Spice", slug: "italian-herb-spice",
      shortDescription: "Hỗn hợp thảo mộc cho món Ý.", description: "Hỗn hợp thảo mộc và tỏi dùng cho pasta cùng các món nướng.",
      bestSeller: false, active: false, images: [], variants: [{ sku: "ITL-050", weightGrams: 50, price: 79_000, stock: 0, active: true }], suggestions: [],
    }, actor);
    const productUpdatedAt = state.document!.products.find((item) => item.id === product.id)!.updatedAt;
    const update = { id: product.id, expectedUpdatedAt: productUpdatedAt, categoryId: category.id, name: "Italian Herb Spice 2", slug: product.slug, shortDescription: product.shortDescription, description: product.description, bestSeller: false, active: false, images: [], variants: state.document!.productVariants.filter((item) => item.productId === product.id).map((variant) => ({ id: variant.id, sku: variant.sku, weightGrams: variant.weightGrams, price: variant.price, originalPrice: variant.originalPrice, stock: variant.stock, expectedVersion: variant.version, active: variant.active })), suggestions: [] };
    await saveProduct(update, actor);
    await expect(saveProduct({ ...update, name: "Ghi đè sản phẩm cũ" }, actor)).rejects.toMatchObject({ status: 409, code: "STALE_CATALOG_WRITE" });

    const expectedRevision = state.document!.revision;
    const entries = [
      ["hero_product_id", null], ["featured_product_id", null], ["homepage_best_seller_limit", 8], ["free_shipping_threshold", 0], ["default_shipping_fee", 0], ["pending_order_expiry_hours", 48], ["order_pii_retention_days", 730], ["order_asset_retention_days", 730], ["announcement_text", "Catalog"], ["store_contact", {}],
    ] as const;
    await updateSiteSettings(entries, actor.adminId, actor.requestId, expectedRevision);
    await expect(updateSiteSettings(entries, actor.adminId, actor.requestId, expectedRevision)).rejects.toMatchObject({ status: 409, code: "STALE_CATALOG_WRITE" });
  });

  it("schedules removed JSON Blob references for post-commit cleanup", async () => {
    process.env.STORAGE_ADAPTER = "vercel-blob";
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_store123_secret";
    const oldPathname = "moon-spice/products/old.webp";
    const oldUrl = `https://store123.public.blob.vercel-storage.com/${oldPathname}`;
    const category = await saveCategory({ name: "Italian Spice", slug: "italian-spice", description: "Danh mục", imageUrl: oldUrl, imageStorageProvider: "VERCEL_BLOB", imageBlobPathname: oldPathname, imageAlt: "Danh mục", sortOrder: 0, active: true }, actor);
    await saveCategory({ id: category.id, expectedUpdatedAt: state.document!.categories[0].updatedAt, name: category.name, slug: category.slug, description: "Danh mục", imageUrl: "/images/category.webp", imageStorageProvider: "LOCAL", imageBlobPathname: null, imageAlt: "Danh mục", sortOrder: 0, active: true }, actor);
    expect(cleanupMock).toHaveBeenCalledWith([oldPathname]);

    cleanupMock.mockClear();
    const productImageId = "00000000-0000-4000-8000-000000000051";
    const product = await saveProduct({ categoryId: category.id, name: "Italian Herb Spice", slug: "italian-herb-spice", shortDescription: "Hỗn hợp thảo mộc cho món Ý.", description: "Hỗn hợp thảo mộc và tỏi dùng cho pasta cùng các món nướng.", bestSeller: false, active: true, images: [{ id: productImageId, url: oldUrl, storageProvider: "VERCEL_BLOB", blobPathname: oldPathname, role: "GALLERY", alt: "Sản phẩm", focalX: 50, focalY: 50, sortOrder: 0, isPrimary: true }], variants: [{ sku: "ITL-050", weightGrams: 50, price: 79_000, stock: 1, active: true }], suggestions: [] }, actor);
    const variant = state.document!.productVariants.find((item) => item.productId === product.id)!;
    await saveProduct({ id: product.id, expectedUpdatedAt: state.document!.products.find((item) => item.id === product.id)!.updatedAt, categoryId: category.id, name: product.name, slug: product.slug, shortDescription: product.shortDescription, description: product.description, bestSeller: false, active: false, images: [], variants: [{ id: variant.id, sku: variant.sku, weightGrams: variant.weightGrams, price: variant.price, originalPrice: variant.originalPrice, stock: variant.stock, expectedVersion: variant.version, active: variant.active }], suggestions: [] }, actor);
    expect(cleanupMock).toHaveBeenCalledWith([oldPathname]);
  });
});
