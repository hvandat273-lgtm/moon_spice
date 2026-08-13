import { describe, expect, it } from "vitest";
import { categories, products } from "@/lib/demo-data";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("demo catalog", () => {
  it("uses API-compatible UUIDs for every cart-facing entity", () => {
    expect(categories).not.toHaveLength(0);
    expect(products).not.toHaveLength(0);
    for (const category of categories) expect(category.id).toMatch(UUID_V4);
    for (const product of products) {
      expect(product.id).toMatch(UUID_V4);
      expect(product.categoryId).toMatch(UUID_V4);
      for (const variant of product.variants) expect(variant.id).toMatch(UUID_V4);
    }
  });

  it("publishes only products that can actually be purchased", () => {
    for (const product of products.filter((item) => item.active)) {
      expect(product.images.some((image) => image.isPrimary)).toBe(true);
      expect(product.variants.some((variant) => variant.active && variant.stock > 0)).toBe(true);
    }
  });
});
