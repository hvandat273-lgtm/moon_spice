import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import { categories, productImages, productUsageSuggestions, products, productVariants } from "@/db/schema";
import { readCatalogDocument } from "@/lib/server/catalog-store";
import { usesJsonCatalogBackend } from "@/lib/server/env";
import { getSiteSetting } from "@/lib/server/settings";
import type {
  AdminCategoryItem,
  AdminDashboardData,
  AdminPageResult,
  AdminProductDetail,
  AdminProductListItem,
  AdminSettingsData,
} from "./types";

const PAGE_SIZE = 12;

function pageResult<T>(items: T[], page: number, total: number, pageSize = PAGE_SIZE): AdminPageResult<T> {
  return { items, page, pageSize, total, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

// Legacy PostgreSQL compatibility helper. The catalog-only dashboard never reads customer data.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function maskPhone(phone: string): string {
  const clean = phone.replace(/\s+/g, "");
  return clean.length < 4 ? "••••" : `•••• ${clean.slice(-4)}`;
}

export async function readAdminDashboard(): Promise<AdminDashboardData> {
  if (usesJsonCatalogBackend()) {
    const document = await readCatalogDocument({ fresh: true });
    return {
      productCount: document.products.length,
      lowStockCount: document.productVariants.filter((variant) => variant.active && variant.stock <= 10).length,
    };
  }
  const db = getDatabase();
  const productStats = await db
    .select({
      productCount: sql<number>`count(distinct ${products.id})`,
      lowStockCount: sql<number>`count(${productVariants.id}) filter (where ${productVariants.active} = true and ${productVariants.stock} <= 10)`,
    })
    .from(products)
    .leftJoin(productVariants, eq(productVariants.productId, products.id));
  return {
    productCount: Number(productStats[0]?.productCount ?? 0),
    lowStockCount: Number(productStats[0]?.lowStockCount ?? 0),
  };
}

export async function readAdminProducts(input: { page?: number; q?: string } = {}): Promise<AdminPageResult<AdminProductListItem>> {
  const page = Math.max(1, input.page ?? 1);
  const query = input.q?.trim() ?? "";
  if (usesJsonCatalogBackend()) {
    const document = await readCatalogDocument({ fresh: true });
    const needle = query.toLocaleLowerCase("vi");
    const filtered = [...document.products]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || left.id.localeCompare(right.id))
      .map((product): AdminProductListItem => {
        const category = document.categories.find((item) => item.id === product.categoryId);
        const variants = document.productVariants.filter((variant) => variant.productId === product.id);
        const image = document.productImages.find((item) => item.productId === product.id && item.isPrimary);
        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          categoryName: category?.name ?? "—",
          imageUrl: image?.url ?? null,
          minimumPrice: variants.length ? Math.min(...variants.map((variant) => variant.price)) : null,
          totalStock: variants.reduce((sum, variant) => sum + variant.stock, 0),
          variantCount: variants.length,
          active: product.active,
          bestSeller: product.bestSeller,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        };
      })
      .filter((product) => {
        if (!needle) return true;
        const skus = document.productVariants.filter((variant) => variant.productId === product.id).map((variant) => variant.sku).join(" ");
        return `${product.name} ${product.slug} ${product.categoryName} ${skus}`.toLocaleLowerCase("vi").includes(needle);
      });
    return pageResult(filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), page, filtered.length);
  }

  const db = getDatabase();
  const filter = query
    ? or(
        ilike(products.name, `%${query}%`),
        ilike(products.slug, `%${query}%`),
        sql`exists (select 1 from ${productVariants} pv where pv.product_id = ${products.id} and pv.sku ilike ${`%${query}%`})`,
      )
    : undefined;
  const [totalRows, baseRows] = await Promise.all([
    db.select({ value: count() }).from(products).where(filter),
    db
      .select({ product: products, categoryName: categories.name })
      .from(products)
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .where(filter)
      .orderBy(desc(products.createdAt), asc(products.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
  ]);
  const ids = baseRows.map((row) => row.product.id);
  const [variantRows, imageRows] = ids.length
    ? await Promise.all([
        db.select().from(productVariants).where(inArray(productVariants.productId, ids)),
        db.select().from(productImages).where(and(inArray(productImages.productId, ids), eq(productImages.isPrimary, true))),
      ])
    : [[], []];

  return pageResult(
    baseRows.map(({ product, categoryName }) => {
      const variants = variantRows.filter((variant) => variant.productId === product.id);
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        categoryName,
        imageUrl: imageRows.find((image) => image.productId === product.id)?.url ?? null,
        minimumPrice: variants.length ? Math.min(...variants.map((variant) => variant.price)) : null,
        totalStock: variants.reduce((sum, variant) => sum + variant.stock, 0),
        variantCount: variants.length,
        active: product.active,
        bestSeller: product.bestSeller,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      };
    }),
    page,
    Number(totalRows[0]?.value ?? 0),
  );
}

export async function readHomepageProductOptions(): Promise<Array<{ id: string; name: string }>> {
  if (usesJsonCatalogBackend()) {
    const document = await readCatalogDocument({ fresh: true });
    const activeCategories = new Set(document.categories.filter((category) => category.active).map((category) => category.id));
    return document.products
      .filter((product) => product.active
        && activeCategories.has(product.categoryId)
        && document.productVariants.some((variant) => variant.productId === product.id && variant.active)
        && document.productImages.filter((image) => image.productId === product.id && image.isPrimary).length === 1)
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(({ id, name }) => ({ id, name }));
  }
  return getDatabase()
    .select({ id: products.id, name: products.name })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(and(
      eq(products.active, true),
      eq(categories.active, true),
      sql`exists (select 1 from ${productVariants} pv where pv.product_id = ${products.id} and pv.active = true)`,
      sql`exists (select 1 from ${productImages} pi where pi.product_id = ${products.id} and pi.is_primary = true)`,
    ))
    .orderBy(asc(products.name), asc(products.id));
}

export async function readAdminProduct(id: string): Promise<AdminProductDetail | null> {
  if (usesJsonCatalogBackend()) {
    const document = await readCatalogDocument({ fresh: true });
    const product = document.products.find((item) => item.id === id);
    if (!product) return null;
    return {
      id: product.id,
      categoryId: product.categoryId,
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      description: product.description,
      ingredients: product.ingredients,
      usage: product.usage,
      storageInstructions: product.storageInstructions,
      origin: product.origin,
      manufacturer: product.manufacturer,
      distributor: product.distributor,
      shelfLife: product.shelfLife,
      allergenWarning: product.allergenWarning,
      nutritionInfo: product.nutritionInfo,
      bestSeller: product.bestSeller,
      active: product.active,
      updatedAt: product.updatedAt,
      images: document.productImages.filter((image) => image.productId === id).sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt)).map((image) => ({
        id: image.id, url: image.url, alt: image.alt, storageProvider: image.storageProvider, blobPathname: image.blobPathname,
        role: image.role, focalX: image.focalX, focalY: image.focalY, isPrimary: image.isPrimary, sortOrder: image.sortOrder,
      })),
      variants: document.productVariants.filter((variant) => variant.productId === id).sort((a, b) => a.weightGrams - b.weightGrams).map((variant) => ({
        id: variant.id, sku: variant.sku, weightGrams: variant.weightGrams, price: variant.price, originalPrice: variant.originalPrice,
        stock: variant.stock, active: variant.active, version: variant.version, expectedVersion: variant.version,
      })),
      suggestions: document.usageSuggestions.filter((suggestion) => suggestion.productId === id).sort((a, b) => a.sortOrder - b.sortOrder).map((suggestion) => ({
        id: suggestion.id, productImageId: suggestion.productImageId, title: suggestion.title, description: suggestion.description,
        sortOrder: suggestion.sortOrder, active: suggestion.active,
      })),
    };
  }
  const db = getDatabase();
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) return null;
  const [variants, images, suggestions] = await Promise.all([
    db.select().from(productVariants).where(eq(productVariants.productId, id)).orderBy(asc(productVariants.weightGrams)),
    db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(asc(productImages.sortOrder), asc(productImages.createdAt)),
    db.select().from(productUsageSuggestions).where(eq(productUsageSuggestions.productId, id)).orderBy(asc(productUsageSuggestions.sortOrder)),
  ]);
  return {
    id: product.id,
    categoryId: product.categoryId,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    ingredients: product.ingredients ?? "",
    usage: product.usage ?? "",
    storageInstructions: product.storageInstructions ?? "",
    origin: product.origin ?? "",
    manufacturer: product.manufacturer ?? "",
    distributor: product.distributor ?? "",
    shelfLife: product.shelfLife ?? "",
    allergenWarning: product.allergenWarning ?? "",
    nutritionInfo: product.nutritionInfo ?? "",
    bestSeller: product.bestSeller,
    active: product.active,
    updatedAt: product.updatedAt.toISOString(),
    images: images.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt,
      storageProvider: image.storageProvider,
      blobPathname: image.blobPathname,
      role: image.role,
      focalX: image.focalX,
      focalY: image.focalY,
      isPrimary: image.isPrimary,
      sortOrder: image.sortOrder,
    })),
    variants: variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      weightGrams: variant.weightGrams,
      price: variant.price,
      originalPrice: variant.originalPrice,
      stock: variant.stock,
      active: variant.active,
      version: variant.version,
      expectedVersion: variant.version,
    })),
    suggestions: suggestions.map((suggestion) => ({
      id: suggestion.id,
      productImageId: suggestion.productImageId,
      title: suggestion.title,
      description: suggestion.description,
      sortOrder: suggestion.sortOrder,
      active: suggestion.active,
    })),
  };
}

export async function readAdminCategories(): Promise<AdminCategoryItem[]> {
  if (usesJsonCatalogBackend()) {
    const document = await readCatalogDocument({ fresh: true });
    return [...document.categories]
      .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name))
      .map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        imageUrl: category.imageUrl,
        imageAlt: category.imageAlt,
        imageStorageProvider: category.imageUrl.startsWith("https://") ? "VERCEL_BLOB" as const : category.imageUrl ? "LOCAL" as const : null,
        imageBlobPathname: category.imageUrl.startsWith("https://") ? new URL(category.imageUrl).pathname.replace(/^\//, "") : null,
        sortOrder: category.sortOrder,
        active: category.active,
        productCount: document.products.filter((product) => product.categoryId === category.id).length,
        updatedAt: category.updatedAt,
      }));
  }
  const rows = await getDatabase()
    .select({ category: categories, productCount: count(products.id) })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  return rows.map(({ category, productCount }) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    imageUrl: category.imageUrl ?? "",
    imageAlt: category.imageAlt ?? "",
    imageStorageProvider: category.imageStorageProvider,
    imageBlobPathname: category.imageBlobPathname,
    sortOrder: category.sortOrder,
    active: category.active,
    productCount: Number(productCount),
    updatedAt: category.updatedAt.toISOString(),
  }));
}

export async function readAdminSettings(): Promise<AdminSettingsData> {
  if (usesJsonCatalogBackend()) {
    const document = await readCatalogDocument({ fresh: true });
    return { ...document.settings, expectedRevision: document.revision };
  }
  const [heroProductId, featuredProductId, homepageBestSellerLimit, freeShippingThreshold, defaultShippingFee, pendingOrderExpiryHours, orderPiiRetentionDays, orderAssetRetentionDays, announcementText, storeContact] = await Promise.all([
    getSiteSetting("hero_product_id"),
    getSiteSetting("featured_product_id"),
    getSiteSetting("homepage_best_seller_limit"),
    getSiteSetting("free_shipping_threshold"),
    getSiteSetting("default_shipping_fee"),
    getSiteSetting("pending_order_expiry_hours"),
    getSiteSetting("order_pii_retention_days"),
    getSiteSetting("order_asset_retention_days"),
    getSiteSetting("announcement_text"),
    getSiteSetting("store_contact"),
  ]);
  return { heroProductId, featuredProductId, homepageBestSellerLimit, freeShippingThreshold, defaultShippingFee, pendingOrderExpiryHours, orderPiiRetentionDays, orderAssetRetentionDays, announcementText, storeContact };
}
