import { afterEach, describe, expect, it, vi } from "vitest";

import { emptyCatalogDocument, getCatalogBackend, mutateCatalogDocument, parseCatalogDocument, readCatalogDocument } from "@/lib/server/catalog-store";

describe("catalog JSON document validation", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("accepts a normalized empty document", () => {
    expect(parseCatalogDocument(emptyCatalogDocument())).toMatchObject({ schemaVersion: 1, revision: 0, products: [], categories: [] });
  });

  it("rejects dangling product references", () => {
    const document = emptyCatalogDocument();
    document.products.push({ id: "20000000-0000-4000-8000-000000000001", categoryId: "10000000-0000-4000-8000-000000000001", name: "商品", slug: "product", shortDescription: "十分な長さの商品説明です。", description: "これは検証に必要な長さを満たしている商品説明テキストです。", ingredients: "", usage: "", storageInstructions: "", origin: "", manufacturer: "", distributor: "", shelfLife: "", allergenWarning: "", nutritionInfo: "", bestSeller: false, active: true, createdAt: "2026-08-12T00:00:00.000Z", updatedAt: "2026-08-12T00:00:00.000Z" });
    expect(() => parseCatalogDocument(document)).toThrow(/Unknown categoryId/);
  });

  it("rejects IDs reused across record collections", () => {
    const document = emptyCatalogDocument();
    const id = "10000000-0000-4000-8000-000000000001";
    const timestamp = "2026-08-12T00:00:00.000Z";
    document.categories.push({ id, name: "カテゴリ", slug: "category", description: "", imageUrl: "", imageAlt: "", sortOrder: 0, active: true, createdAt: timestamp, updatedAt: timestamp });
    document.products.push({ id, categoryId: id, name: "商品", slug: "product", shortDescription: "十分な長さの商品説明です。", description: "これは検証に必要な長さを満たしている商品説明テキストです。", ingredients: "", usage: "", storageInstructions: "", origin: "", manufacturer: "", distributor: "", shelfLife: "", allergenWarning: "", nutritionInfo: "", bestSeller: false, active: true, createdAt: timestamp, updatedAt: timestamp });
    expect(() => parseCatalogDocument(document)).toThrow(/globally unique/);
  });

  it("serves the bundled showcase read-only when Vercel has no persistent backend", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("DEPLOYMENT_MODE", "catalog");
    delete process.env.CATALOG_BACKEND;
    delete process.env.DATABASE_URL;

    expect(getCatalogBackend()).toBe("bundled-json");
    await expect(readCatalogDocument({ fresh: true })).resolves.toMatchObject({
      products: [expect.objectContaining({ slug: "pasta-magic-powder" })],
    });
    await expect(mutateCatalogDocument(() => undefined)).rejects.toThrow(/read-only/);
  });

  it("maps an accidental Vercel local-json setting to the read-only showcase", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("CATALOG_BACKEND", "local-json");
    expect(getCatalogBackend()).toBe("bundled-json");
  });
});
