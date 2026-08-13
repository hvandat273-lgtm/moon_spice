import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { getDatabase } from "@/db/client";
import {
  categories as categoryTable,
  orderItems,
  orders,
  productImages,
  products as productTable,
  productUsageSuggestions,
  productVariants,
  reviews as reviewTable,
} from "@/db/schema";
import type { Category, Product, ProductImage, ProductVariant, Review, UsageSuggestion } from "@/types/domain";

import { getCatalogBackend, readCatalogDocument, type CatalogDocument } from "./catalog-store";
import { assertProductionEnvironment } from "./env";
import { getSiteSetting } from "./settings";

type ProductBase = typeof productTable.$inferSelect & { categoryName: string };

export interface CatalogListOptions {
  categorySlug?: string;
  search?: string;
  bestSeller?: boolean;
  limit?: number;
  page?: number;
  pageSize?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: "featured" | "newest" | "name" | "price-asc" | "price-desc" | "price_asc" | "price_desc" | "sales";
}

function hydrateDocumentProducts(document: CatalogDocument): Product[] {
  const categoryById = new Map(document.categories.map((category) => [category.id, category]));
  const imagesByProduct = new Map<string, ProductImage[]>();
  for (const row of [...document.productImages].sort((left, right) => left.sortOrder - right.sortOrder || left.createdAt.localeCompare(right.createdAt))) {
    const image: ProductImage = {
      id: row.id,
      url: row.url,
      alt: row.alt,
      role: row.role,
      isPrimary: row.isPrimary,
      focalX: row.focalX,
      focalY: row.focalY,
    };
    imagesByProduct.set(row.productId, [...(imagesByProduct.get(row.productId) ?? []), image]);
  }

  const variantsByProduct = new Map<string, ProductVariant[]>();
  for (const row of [...document.productVariants].sort((left, right) => left.weightGrams - right.weightGrams)) {
    if (!row.active) continue;
    const variant: ProductVariant = {
      id: row.id,
      sku: row.sku,
      weightGrams: row.weightGrams,
      price: row.price,
      originalPrice: row.originalPrice,
      stock: row.stock,
      active: row.active,
      version: row.version,
    };
    variantsByProduct.set(row.productId, [...(variantsByProduct.get(row.productId) ?? []), variant]);
  }

  const imageById = new Map(document.productImages.map((image) => [image.id, image]));
  const suggestionsByProduct = new Map<string, UsageSuggestion[]>();
  for (const row of [...document.usageSuggestions].sort((left, right) => left.sortOrder - right.sortOrder)) {
    if (!row.active) continue;
    const image = imageById.get(row.productImageId);
    if (!image) continue;
    const suggestion: UsageSuggestion = {
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      sortOrder: row.sortOrder,
      image: { id: image.id, url: image.url, alt: image.alt, role: image.role, focalX: image.focalX, focalY: image.focalY },
    };
    suggestionsByProduct.set(row.productId, [...(suggestionsByProduct.get(row.productId) ?? []), suggestion]);
  }

  const reviewsByProduct = new Map<string, Review[]>();
  for (const row of [...document.reviews].sort((left, right) => right.reviewedAt.localeCompare(left.reviewedAt))) {
    if (!row.approved || row.source === "DEMO") continue;
    const review: Review = {
      id: row.id,
      customerName: row.customerName,
      rating: row.rating,
      content: row.content,
      reviewedAt: row.reviewedAt,
      approved: row.approved,
      source: row.source,
    };
    reviewsByProduct.set(row.productId, [...(reviewsByProduct.get(row.productId) ?? []), review]);
  }

  return document.products.flatMap((row) => {
    const category = categoryById.get(row.categoryId);
    if (!category) return [];
    return [{
      id: row.id,
      categoryId: row.categoryId,
      categoryName: category.name,
      name: row.name,
      slug: row.slug,
      shortDescription: row.shortDescription,
      description: row.description,
      ingredients: row.ingredients || undefined,
      usage: row.usage || undefined,
      storageInstructions: row.storageInstructions || undefined,
      origin: row.origin || undefined,
      manufacturer: row.manufacturer || undefined,
      distributor: row.distributor || undefined,
      shelfLife: row.shelfLife || undefined,
      allergenWarning: row.allergenWarning || undefined,
      nutritionInfo: row.nutritionInfo || undefined,
      bestSeller: row.bestSeller,
      active: row.active,
      images: imagesByProduct.get(row.id) ?? [],
      variants: variantsByProduct.get(row.id) ?? [],
      usageSuggestions: suggestionsByProduct.get(row.id) ?? [],
      reviews: reviewsByProduct.get(row.id) ?? [],
    } satisfies Product];
  });
}

function documentCatalogRows(document: CatalogDocument, options: CatalogListOptions): Product[] {
  const activeCategoryIds = new Set(document.categories.filter((category) => category.active).map((category) => category.id));
  let rows = hydrateDocumentProducts(document).filter((product) => product.active && activeCategoryIds.has(product.categoryId) && product.variants.length > 0);
  if (options.categorySlug) {
    const category = document.categories.find((item) => item.active && item.slug === options.categorySlug);
    rows = category ? rows.filter((product) => product.categoryId === category.id) : [];
  }
  if (options.search?.trim()) {
    const needle = options.search.trim().toLocaleLowerCase("vi");
    rows = rows.filter((product) => `${product.name} ${product.slug} ${product.shortDescription} ${product.variants.map((variant) => variant.sku).join(" ")}`.toLocaleLowerCase("vi").includes(needle));
  }
  if (options.bestSeller) rows = rows.filter((product) => product.bestSeller);
  const minimum = Number.isSafeInteger(options.minPrice) && (options.minPrice ?? 0) >= 0 ? options.minPrice : undefined;
  const maximum = Number.isSafeInteger(options.maxPrice) && (options.maxPrice ?? 0) >= 0 ? options.maxPrice : undefined;
  if (minimum !== undefined || maximum !== undefined) {
    rows = rows.filter((product) => product.variants.some((variant) => (minimum === undefined || variant.price >= minimum) && (maximum === undefined || variant.price <= maximum)));
  }
  const createdAt = new Map(document.products.map((product) => [product.id, product.createdAt]));
  if (options.sort === "newest") rows.sort((left, right) => (createdAt.get(right.id) ?? "").localeCompare(createdAt.get(left.id) ?? "") || left.id.localeCompare(right.id));
  else if (options.sort === "name") rows.sort((left, right) => left.name.localeCompare(right.name, "vi") || left.id.localeCompare(right.id));
  else if (["price-asc", "price-desc", "price_asc", "price_desc"].includes(options.sort ?? "")) {
    const direction = options.sort === "price-asc" || options.sort === "price_asc" ? 1 : -1;
    rows.sort((left, right) => direction * (Math.min(...left.variants.map((variant) => variant.price)) - Math.min(...right.variants.map((variant) => variant.price))) || left.id.localeCompare(right.id));
  } else {
    rows.sort((left, right) => Number(right.bestSeller) - Number(left.bestSeller) || (createdAt.get(left.id) ?? "").localeCompare(createdAt.get(right.id) ?? "") || left.id.localeCompare(right.id));
  }
  return rows;
}

async function hydrateDatabaseProducts(baseRows: ProductBase[]): Promise<Product[]> {
  if (baseRows.length === 0) return [];
  const db = getDatabase();
  const ids = baseRows.map((row) => row.id);
  const [imageRows, variantRows, suggestionRows, reviewRows] = await Promise.all([
    db.select().from(productImages).where(inArray(productImages.productId, ids)).orderBy(asc(productImages.sortOrder), asc(productImages.createdAt)),
    db.select().from(productVariants).where(and(inArray(productVariants.productId, ids), eq(productVariants.active, true))).orderBy(asc(productVariants.weightGrams)),
    db.select({ suggestion: productUsageSuggestions, image: productImages }).from(productUsageSuggestions).innerJoin(productImages, eq(productImages.id, productUsageSuggestions.productImageId)).where(and(inArray(productUsageSuggestions.productId, ids), eq(productUsageSuggestions.active, true))).orderBy(asc(productUsageSuggestions.sortOrder)),
    db.select().from(reviewTable).where(and(inArray(reviewTable.productId, ids), eq(reviewTable.approved, true))).orderBy(desc(reviewTable.reviewedAt), desc(reviewTable.createdAt)),
  ]);
  const imagesByProduct = new Map<string, ProductImage[]>();
  for (const row of imageRows) imagesByProduct.set(row.productId, [...(imagesByProduct.get(row.productId) ?? []), { id: row.id, url: row.url, alt: row.alt, role: row.role, isPrimary: row.isPrimary, focalX: row.focalX, focalY: row.focalY }]);
  const variantsByProduct = new Map<string, ProductVariant[]>();
  for (const row of variantRows) variantsByProduct.set(row.productId, [...(variantsByProduct.get(row.productId) ?? []), { id: row.id, sku: row.sku, weightGrams: row.weightGrams, price: row.price, originalPrice: row.originalPrice, stock: row.stock, active: row.active, version: row.version }]);
  const suggestionsByProduct = new Map<string, UsageSuggestion[]>();
  for (const row of suggestionRows) suggestionsByProduct.set(row.suggestion.productId, [...(suggestionsByProduct.get(row.suggestion.productId) ?? []), { id: row.suggestion.id, title: row.suggestion.title, description: row.suggestion.description ?? undefined, sortOrder: row.suggestion.sortOrder, image: { id: row.image.id, url: row.image.url, alt: row.image.alt, role: row.image.role, focalX: row.image.focalX, focalY: row.image.focalY } }]);
  const reviewsByProduct = new Map<string, Review[]>();
  for (const row of reviewRows) {
    if (row.source === "DEMO") continue;
    reviewsByProduct.set(row.productId, [...(reviewsByProduct.get(row.productId) ?? []), { id: row.id, customerName: row.customerName, rating: row.rating, content: row.content, reviewedAt: (row.reviewedAt ?? row.createdAt).toISOString(), approved: row.approved, source: row.source }]);
  }
  return baseRows.map((row) => ({ id: row.id, categoryId: row.categoryId, categoryName: row.categoryName, name: row.name, slug: row.slug, shortDescription: row.shortDescription, description: row.description, ingredients: row.ingredients ?? undefined, usage: row.usage ?? undefined, storageInstructions: row.storageInstructions ?? undefined, origin: row.origin ?? undefined, manufacturer: row.manufacturer ?? undefined, distributor: row.distributor ?? undefined, shelfLife: row.shelfLife ?? undefined, allergenWarning: row.allergenWarning ?? undefined, nutritionInfo: row.nutritionInfo ?? undefined, bestSeller: row.bestSeller, active: row.active, images: imagesByProduct.get(row.id) ?? [], variants: variantsByProduct.get(row.id) ?? [], usageSuggestions: suggestionsByProduct.get(row.id) ?? [], reviews: reviewsByProduct.get(row.id) ?? [] }));
}

function baseProductSelect() {
  return { id: productTable.id, categoryId: productTable.categoryId, name: productTable.name, slug: productTable.slug, description: productTable.description, shortDescription: productTable.shortDescription, ingredients: productTable.ingredients, usage: productTable.usage, storageInstructions: productTable.storageInstructions, origin: productTable.origin, manufacturer: productTable.manufacturer, distributor: productTable.distributor, shelfLife: productTable.shelfLife, allergenWarning: productTable.allergenWarning, nutritionInfo: productTable.nutritionInfo, bestSeller: productTable.bestSeller, active: productTable.active, createdAt: productTable.createdAt, updatedAt: productTable.updatedAt, categoryName: categoryTable.name };
}

function catalogOrder(sort: CatalogListOptions["sort"]) {
  const minimumPrice = sql<number>`(select min(pv.price) from product_variants pv where pv.product_id = ${productTable.id} and pv.active = true)`;
  const completedSales = sql<number>`(select coalesce(sum(oi.quantity), 0) from ${orderItems} oi inner join ${orders} customer_order on customer_order.id = oi.order_id where oi.product_id = ${productTable.id} and customer_order.status = 'COMPLETED')`;
  if (sort === "newest") return [desc(productTable.createdAt), asc(productTable.id)] as const;
  if (sort === "name") return [asc(productTable.name), asc(productTable.id)] as const;
  if (sort === "price-asc" || sort === "price_asc") return [asc(minimumPrice), asc(productTable.id)] as const;
  if (sort === "price-desc" || sort === "price_desc") return [desc(minimumPrice), asc(productTable.id)] as const;
  if (sort === "sales") return [desc(completedSales), asc(productTable.createdAt), asc(productTable.id)] as const;
  return [desc(productTable.bestSeller), asc(productTable.createdAt), asc(productTable.id)] as const;
}

function catalogFilters(options: CatalogListOptions): SQL[] {
  const filters: SQL[] = [eq(productTable.active, true), eq(categoryTable.active, true), sql`exists (select 1 from product_variants active_variant where active_variant.product_id = ${productTable.id} and active_variant.active = true)`];
  if (options.categorySlug) filters.push(eq(categoryTable.slug, options.categorySlug));
  if (options.bestSeller) filters.push(eq(productTable.bestSeller, true));
  const minimum = Number.isSafeInteger(options.minPrice) && (options.minPrice ?? 0) >= 0 ? options.minPrice : undefined;
  const maximum = Number.isSafeInteger(options.maxPrice) && (options.maxPrice ?? 0) >= 0 ? options.maxPrice : undefined;
  if (minimum !== undefined || maximum !== undefined) filters.push(sql`exists (select 1 from product_variants pv where pv.product_id = ${productTable.id} and pv.active = true ${minimum !== undefined ? sql`and pv.price >= ${minimum}` : sql``} ${maximum !== undefined ? sql`and pv.price <= ${maximum}` : sql``})`);
  const search = options.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    filters.push(or(ilike(productTable.name, pattern), ilike(productTable.slug, pattern), ilike(productTable.shortDescription, pattern), sql`exists (select 1 from product_variants pv where pv.product_id = ${productTable.id} and pv.active = true and pv.sku ilike ${pattern})`)!);
  }
  return filters;
}

async function listDatabaseProducts(options: CatalogListOptions): Promise<Product[]> {
  const pageSize = Math.min(100, Math.max(1, Math.trunc(options.pageSize ?? options.limit ?? 100)));
  const page = Math.max(1, Math.trunc(options.page ?? 1));
  const rows = await getDatabase().select(baseProductSelect()).from(productTable).innerJoin(categoryTable, eq(categoryTable.id, productTable.categoryId)).where(and(...catalogFilters(options))).orderBy(...catalogOrder(options.sort)).limit(pageSize).offset((page - 1) * pageSize);
  return hydrateDatabaseProducts(rows);
}

const listDatabaseProductsCached = unstable_cache(listDatabaseProducts, ["moon-spice-catalog-products-v2"], { tags: ["products", "categories"], revalidate: 60 });

export async function listCatalogProducts(options: CatalogListOptions = {}): Promise<Product[]> {
  assertProductionEnvironment();
  if (getCatalogBackend() === "postgres") return process.env.NODE_ENV === "test" ? listDatabaseProducts(options) : listDatabaseProductsCached(options);
  const rows = documentCatalogRows(await readCatalogDocument(), options);
  const pageSize = Math.min(100, Math.max(1, Math.trunc(options.pageSize ?? options.limit ?? 100)));
  const page = Math.max(1, Math.trunc(options.page ?? 1));
  return rows.slice((page - 1) * pageSize, page * pageSize);
}

export async function listCatalogProductsPaginated(options: CatalogListOptions = {}) {
  const pageSize = Math.min(100, Math.max(1, Math.trunc(options.pageSize ?? options.limit ?? 24)));
  const page = Math.max(1, Math.trunc(options.page ?? 1));
  if (getCatalogBackend() !== "postgres") {
    const all = documentCatalogRows(await readCatalogDocument(), options);
    return { items: all.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: all.length, totalPages: Math.max(1, Math.ceil(all.length / pageSize)) };
  }
  const [items, countRows] = await Promise.all([
    listCatalogProducts({ ...options, page, pageSize }),
    getDatabase().select({ count: sql<number>`count(*)::int` }).from(productTable).innerJoin(categoryTable, eq(categoryTable.id, productTable.categoryId)).where(and(...catalogFilters(options))),
  ]);
  const total = Number(countRows[0]?.count ?? 0);
  return { items, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export const getProducts = listCatalogProducts;

async function getDatabaseProductBySlug(slug: string): Promise<Product | null> {
  const rows = await getDatabase().select(baseProductSelect()).from(productTable).innerJoin(categoryTable, eq(categoryTable.id, productTable.categoryId)).where(and(eq(productTable.slug, slug), eq(productTable.active, true), eq(categoryTable.active, true))).limit(1);
  return (await hydrateDatabaseProducts(rows))[0] ?? null;
}

export async function getCatalogProductBySlug(slug: string): Promise<Product | null> {
  assertProductionEnvironment();
  if (getCatalogBackend() !== "postgres") return documentCatalogRows(await readCatalogDocument(), {}).find((product) => product.slug === slug) ?? null;
  if (process.env.NODE_ENV === "test") return getDatabaseProductBySlug(slug);
  return unstable_cache(() => getDatabaseProductBySlug(slug), ["moon-spice-product-v2", slug], { tags: ["products", `product:${slug}`], revalidate: 60 })();
}

export const getProductBySlug = getCatalogProductBySlug;

export async function listCatalogCategories(): Promise<Category[]> {
  assertProductionEnvironment();
  if (getCatalogBackend() !== "postgres") {
    return (await readCatalogDocument()).categories.filter((category) => category.active).sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, "vi")).map(({ id, name, slug, description, imageUrl, imageAlt, active, sortOrder }) => ({ id, name, slug, description, imageUrl, imageAlt, active, sortOrder }));
  }
  const rows = await getDatabase().select().from(categoryTable).where(eq(categoryTable.active, true)).orderBy(asc(categoryTable.sortOrder), asc(categoryTable.name));
  return rows.map((row) => ({ id: row.id, name: row.name, slug: row.slug, description: row.description ?? "", imageUrl: row.imageUrl ?? "", imageAlt: row.imageAlt ?? "", active: row.active, sortOrder: row.sortOrder }));
}

export const getCategories = listCatalogCategories;

export interface CatalogSitemapEntries {
  products: Array<{ slug: string; updatedAt: Date }>;
  categories: Array<{ slug: string; updatedAt: Date }>;
}

export async function listCatalogSitemapEntries(): Promise<CatalogSitemapEntries> {
  assertProductionEnvironment();
  if (getCatalogBackend() !== "postgres") {
    const document = await readCatalogDocument();
    const activeCategories = new Set(document.categories.filter((category) => category.active).map((category) => category.id));
    const activeVariants = new Set(document.productVariants.filter((variant) => variant.active).map((variant) => variant.productId));
    return {
      products: document.products.filter((product) => product.active && activeCategories.has(product.categoryId) && activeVariants.has(product.id)).map((product) => ({ slug: product.slug, updatedAt: new Date(product.updatedAt) })).sort((left, right) => left.slug.localeCompare(right.slug)),
      categories: document.categories.filter((category) => category.active).map((category) => ({ slug: category.slug, updatedAt: new Date(category.updatedAt) })).sort((left, right) => left.slug.localeCompare(right.slug)),
    };
  }
  const [productRows, categoryRows] = await Promise.all([
    getDatabase().select({ slug: productTable.slug, updatedAt: productTable.updatedAt }).from(productTable).innerJoin(categoryTable, eq(categoryTable.id, productTable.categoryId)).where(and(eq(productTable.active, true), eq(categoryTable.active, true), sql`exists (select 1 from ${productVariants} pv where pv.product_id = ${productTable.id} and pv.active = true)`)).orderBy(asc(productTable.slug)),
    getDatabase().select({ slug: categoryTable.slug, updatedAt: categoryTable.updatedAt }).from(categoryTable).where(eq(categoryTable.active, true)).orderBy(asc(categoryTable.slug)),
  ]);
  return { products: productRows, categories: categoryRows };
}

async function resolveHomepageProduct(kind: "hero" | "featured"): Promise<Product | null> {
  if (getCatalogBackend() !== "postgres") {
    const document = await readCatalogDocument();
    const products = documentCatalogRows(document, {});
    const configuredId = kind === "hero" ? document.settings.heroProductId : document.settings.featuredProductId;
    const configured = configuredId ? products.find((product) => product.id === configuredId) : undefined;
    const candidates = configured ? [configured] : products;
    return candidates.find((product) => product.images.filter((image) => image.isPrimary).length === 1 && product.variants.length > 0) ?? null;
  }
  const settingKey = kind === "hero" ? "hero_product_id" : "featured_product_id";
  const configuredId = await getSiteSetting(settingKey);
  let candidates: ProductBase[] = configuredId
    ? await getDatabase().select(baseProductSelect()).from(productTable).innerJoin(categoryTable, eq(categoryTable.id, productTable.categoryId)).where(and(eq(productTable.id, configuredId), eq(productTable.active, true), eq(categoryTable.active, true))).limit(1)
    : [];
  if (candidates.length === 0) candidates = await getDatabase().select(baseProductSelect()).from(productTable).innerJoin(categoryTable, eq(categoryTable.id, productTable.categoryId)).where(and(eq(productTable.active, true), eq(categoryTable.active, true))).orderBy(desc(productTable.bestSeller), asc(productTable.createdAt), asc(productTable.id)).limit(20);
  return (await hydrateDatabaseProducts(candidates)).find((product) => product.images.filter((image) => image.isPrimary).length === 1 && product.variants.length > 0) ?? null;
}

export function getHeroProduct(): Promise<Product | null> {
  assertProductionEnvironment();
  return resolveHomepageProduct("hero");
}

export function getFeaturedProduct(): Promise<Product | null> {
  assertProductionEnvironment();
  return resolveHomepageProduct("featured");
}

export async function getHomepageCatalog() {
  const limit = await getSiteSetting("homepage_best_seller_limit");
  const [heroProduct, featuredProduct, bestSellers, categories] = await Promise.all([getHeroProduct(), getFeaturedProduct(), listCatalogProducts({ bestSeller: true, limit }), listCatalogCategories()]);
  return { heroProduct, featuredProduct, bestSellers, categories };
}
