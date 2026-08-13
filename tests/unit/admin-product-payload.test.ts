import { describe, expect, it } from "vitest";

import { backendProduct } from "@/app/admin/_lib/payloads";
import { adminProductSchema } from "@/app/admin/_lib/validation";

describe("admin product payload", () => {
  it("preserves image placement and usage suggestions during an update", () => {
    const parsed = adminProductSchema.parse({
      categoryId: "00000000-0000-4000-8000-000000000010",
      name: "Italian Herb Spice",
      slug: "italian-herb-spice",
      shortDescription: "Hỗn hợp thảo mộc cân bằng cho món Ý.",
      description: "Hỗn hợp thảo mộc được phối trộn theo mẻ nhỏ cho pasta và món nướng.",
      ingredients: "Basil, oregano và rosemary",
      usage: "Rắc trực tiếp lên món ăn",
      storageInstructions: "Bảo quản nơi khô ráo",
      origin: "Việt Nam",
      manufacturer: "Moon Spice",
      distributor: "Moon Spice",
      shelfLife: "12 tháng",
      allergenWarning: "",
      nutritionInfo: "",
      bestSeller: true,
      active: true,
      variants: [{
        id: "00000000-0000-4000-8000-000000000020",
        sku: "ITL-050",
        weightGrams: 50,
        price: 79_000,
        originalPrice: 89_000,
        stock: 12,
        active: true,
        version: 4,
        expectedVersion: 4,
        stockReason: "Không thay đổi tồn kho",
      }],
      images: [
        {
          id: "00000000-0000-4000-8000-000000000030",
          url: "/images/moon-spice-pouch.svg",
          alt: "Túi Italian Herb Spice",
          storageProvider: "LOCAL",
          blobPathname: null,
          role: "GALLERY",
          focalX: 48,
          focalY: 52,
          isPrimary: true,
          sortOrder: 0,
        },
        {
          id: "00000000-0000-4000-8000-000000000031",
          url: "/images/usage-grid.webp",
          alt: "Pasta dùng cùng Italian Herb Spice",
          storageProvider: "LOCAL",
          blobPathname: null,
          role: "USAGE",
          focalX: 72,
          focalY: 35,
          isPrimary: false,
          sortOrder: 1,
        },
      ],
      suggestions: [{
        id: "00000000-0000-4000-8000-000000000040",
        productImageId: "00000000-0000-4000-8000-000000000031",
        title: "Pasta thảo mộc",
        description: "Rắc sau khi trộn sốt.",
        sortOrder: 0,
        active: true,
      }],
    });

    const result = backendProduct(parsed, "00000000-0000-4000-8000-000000000001");

    expect(result.images[1]).toMatchObject({ role: "USAGE", focalX: 72, focalY: 35 });
    expect(result.suggestions).toEqual([{
      id: "00000000-0000-4000-8000-000000000040",
      productImageId: "00000000-0000-4000-8000-000000000031",
      title: "Pasta thảo mộc",
      description: "Rắc sau khi trộn sốt.",
      sortOrder: 0,
      active: true,
    }]);
    expect(result.variants[0]).not.toHaveProperty("version");
    expect(result.variants[0]).toMatchObject({ expectedVersion: 4, stockReason: "Không thay đổi tồn kho" });
  });
});
