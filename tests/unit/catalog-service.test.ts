import { beforeEach, describe, expect, it } from "vitest";

import { listCatalogProductsPaginated } from "@/lib/server/catalog";
import { resetTestCatalog } from "@/tests/helpers/catalog";

describe("public JSON catalog service", () => {
  beforeEach(async () => resetTestCatalog("catalog-service"));

  it("filters, sorts and returns bounded pagination metadata", async () => {
    const result = await listCatalogProductsPaginated({ sort: "price_desc", page: 1, pageSize: 1 });
    expect(result).toMatchObject({ page: 1, pageSize: 1, total: 2, totalPages: 2 });
    expect(result.items[0]?.slug).toBe("basil-mix");
    expect(result.items[0]?.variants.every((variant) => variant.active)).toBe(true);
  });

  it("uses the deterministic best-seller order for sales sorting", async () => {
    const result = await listCatalogProductsPaginated({ sort: "sales", pageSize: 100 });
    expect(result.items.map((product) => product.slug)).toEqual(["garlic-herb", "basil-mix"]);
  });

  it("returns an actual empty catalog instead of fixture products", async () => {
    await resetTestCatalog("catalog-empty", false);
    const result = await listCatalogProductsPaginated({ pageSize: 24 });
    expect(result).toEqual({ items: [], page: 1, pageSize: 24, total: 0, totalPages: 1 });
  });
});
