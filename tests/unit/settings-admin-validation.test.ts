import { describe, expect, it } from "vitest";

import {
  adminCategorySchema,
  adminLoginSchema,
  adminOrderStatusSchema,
  adminProductSchema,
  adminSettingsSchema,
  listQuerySchema,
} from "@/app/admin/_lib/validation";
import { parseSetting } from "@/lib/validation/settings";

const categoryId = "00000000-0000-4000-8000-000000000010";
const featuredProductId = "00000000-0000-4000-8000-000000000011";
const imageId = "00000000-0000-4000-8000-000000000030";

function validProduct() {
  return {
    categoryId,
    name: "Italian Herb Spice",
    slug: "italian-herb-spice",
    shortDescription: "Hỗn hợp thảo mộc cân bằng cho món Ý.",
    description: "Hỗn hợp thảo mộc được phối trộn theo mẻ nhỏ cho pasta và món nướng.",
    ingredients: "Basil, oregano, rosemary",
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
    variants: [{ sku: "ITL-050", weightGrams: 50, price: 79_000, stock: 12, active: true }],
    images: [{
      id: imageId,
      url: "/images/product.webp",
      alt: "Túi gia vị",
      storageProvider: "LOCAL" as const,
      blobPathname: null,
      role: "USAGE" as const,
      focalX: 50,
      focalY: 50,
      isPrimary: true,
      sortOrder: 0,
    }],
    suggestions: [{ productImageId: imageId, title: "Dùng cho pasta", sortOrder: 0, active: true }],
  };
}

describe("shipping settings", () => {
  it("accepts integer VND boundaries and rejects negative, fractional or excessive values", () => {
    expect(parseSetting("free_shipping_threshold", 0)).toBe(0);
    expect(parseSetting("default_shipping_fee", 1_000_000_000)).toBe(1_000_000_000);

    for (const invalid of [-1, 1.5, 1_000_000_001, "30000"]) {
      expect(() => parseSetting("default_shipping_fee", invalid)).toThrow();
    }
  });

  it("bounds pending expiry and retention independently", () => {
    expect(parseSetting("pending_order_expiry_hours", 1)).toBe(1);
    expect(parseSetting("pending_order_expiry_hours", 168)).toBe(168);
    expect(() => parseSetting("pending_order_expiry_hours", 0)).toThrow();
    expect(() => parseSetting("pending_order_expiry_hours", 169)).toThrow();
    expect(() => parseSetting("order_pii_retention_days", 29)).toThrow();
    expect(parseSetting("order_pii_retention_days", 730)).toBe(730);
  });
});

describe("admin mutation payloads", () => {
  it("measures admin passwords in UTF-8 bytes", () => {
    expect(adminLoginSchema.safeParse({ email: "owner@example.com", password: "123456789012" }).success).toBe(true);
    expect(adminLoginSchema.safeParse({ email: "owner@example.com", password: "ngắn" }).success).toBe(false);
    expect(adminLoginSchema.safeParse({ email: "owner@example.com", password: "🔐🔐🔐" }).success).toBe(true);
    expect(adminLoginSchema.safeParse({ email: "owner@example.com", password: "a".repeat(73) }).success).toBe(false);
  });

  it("enforces product invariants before a mutation reaches the database", () => {
    expect(adminProductSchema.safeParse(validProduct()).success).toBe(true);

    const duplicateVariant = validProduct();
    duplicateVariant.variants.push({ ...duplicateVariant.variants[0] });
    expect(adminProductSchema.safeParse(duplicateVariant).success).toBe(false);

    const duplicatePrimary = validProduct();
    duplicatePrimary.images.push({
      ...duplicatePrimary.images[0],
      id: "00000000-0000-4000-8000-000000000031",
      role: "USAGE",
      sortOrder: 1,
    });
    expect(adminProductSchema.safeParse(duplicatePrimary).success).toBe(false);

    const danglingSuggestion = validProduct();
    danglingSuggestion.suggestions[0].productImageId = "00000000-0000-4000-8000-000000000099";
    expect(adminProductSchema.safeParse(danglingSuggestion).success).toBe(false);
  });

  it("limits product assets and rejects unknown client-controlled fields", () => {
    const product = validProduct();
    const tooManyImages = {
      ...product,
      images: Array.from({ length: 13 }, (_, index) => ({
        ...product.images[0],
        id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
        isPrimary: index === 0,
        sortOrder: index,
      })),
      suggestions: [],
    };
    expect(adminProductSchema.safeParse(tooManyImages).success).toBe(false);
    expect(adminProductSchema.safeParse({ ...product, wholesalePrice: 1 }).success).toBe(false);
  });

  it("validates status, settings, category slug and bounded list filters", () => {
    expect(adminOrderStatusSchema.safeParse({
      status: "COMPLETED",
      expectedStatus: "SHIPPING",
      reason: "Đã thu COD",
      paymentReceived: true,
    }).success).toBe(true);
    expect(adminOrderStatusSchema.safeParse({
      status: "REFUNDED",
      expectedStatus: "COMPLETED",
      reason: "Unsupported",
    }).success).toBe(false);

    expect(adminSettingsSchema.safeParse({
      heroProductId: categoryId,
      featuredProductId,
      homepageBestSellerLimit: 8,
      freeShippingThreshold: 500_000,
      defaultShippingFee: 30_000,
      pendingOrderExpiryHours: 48,
      orderPiiRetentionDays: 730,
      orderAssetRetentionDays: 730,
      announcementText: "Miễn phí giao hàng",
      storeContact: {
        email: "hello@moonspice.example",
        facebookUrl: "https://www.facebook.com/moorspice",
        instagramUrl: "https://www.instagram.com/moorspice",
      },
    }).success).toBe(true);
    expect(parseSetting("store_contact", {
      phone: "+81 3 0000 0000",
      facebookUrl: "https://www.facebook.com/moorspice",
      instagramUrl: "https://www.instagram.com/moorspice",
    })).toMatchObject({ facebookUrl: "https://www.facebook.com/moorspice" });
    expect(parseSetting.bind(null, "store_contact", { facebookUrl: "http://facebook.com/moorspice" })).toThrow();
    expect(adminSettingsSchema.safeParse({
      heroProductId: categoryId,
      featuredProductId,
      homepageBestSellerLimit: 8,
      freeShippingThreshold: 500_000,
      defaultShippingFee: 30_000,
      pendingOrderExpiryHours: 48,
      orderPiiRetentionDays: 730,
      orderAssetRetentionDays: 730,
      announcementText: "Miễn phí giao hàng",
      storeContact: { instagramUrl: "javascript:alert(1)" },
    }).success).toBe(false);
    expect(adminSettingsSchema.safeParse({
      heroProductId: categoryId,
      featuredProductId,
      homepageBestSellerLimit: 8,
      freeShippingThreshold: 500_000,
      defaultShippingFee: 30_000,
      pendingOrderExpiryHours: 48,
      orderPiiRetentionDays: 730,
      orderAssetRetentionDays: 730,
      announcementText: "Miễn phí giao hàng",
      storeContact: {},
    }).success).toBe(true);
    expect(adminSettingsSchema.safeParse({
      heroProductId: categoryId,
      featuredProductId: categoryId,
      homepageBestSellerLimit: 8,
      freeShippingThreshold: 500_000,
      defaultShippingFee: 30_000,
      pendingOrderExpiryHours: 48,
      orderPiiRetentionDays: 730,
      orderAssetRetentionDays: 730,
      announcementText: "Miễn phí giao hàng",
      storeContact: {},
    }).success).toBe(true);
    expect(adminSettingsSchema.safeParse({
      heroProductId: categoryId,
      featuredProductId: categoryId,
      homepageBestSellerLimit: 13,
      freeShippingThreshold: -1,
      defaultShippingFee: 30_000,
      pendingOrderExpiryHours: 48,
      orderPiiRetentionDays: 730,
      orderAssetRetentionDays: 730,
      announcementText: "x".repeat(161),
      storeContact: {},
    }).success).toBe(false);

    expect(adminCategorySchema.safeParse({ name: "Gia vị", slug: "Gia Vi", description: "", imageUrl: "", imageAlt: "", sortOrder: 0, active: true }).success).toBe(false);
    expect(listQuerySchema.safeParse({ page: "0", q: "", status: "" }).success).toBe(false);
    expect(listQuerySchema.safeParse({ page: "1", q: "x".repeat(121), status: "" }).success).toBe(false);
  });
});
