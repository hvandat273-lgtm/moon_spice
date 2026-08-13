export type AdminRole = "OWNER" | "ADMIN";

export interface AdminPrincipal {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  demo: boolean;
}

export interface AdminDashboardData {
  productCount: number;
  lowStockCount: number;
}

export interface AdminProductListItem {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  imageUrl: string | null;
  minimumPrice: number | null;
  totalStock: number;
  variantCount: number;
  active: boolean;
  bestSeller: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductImageInput {
  id?: string;
  url: string;
  alt: string;
  storageProvider: "LOCAL" | "VERCEL_BLOB";
  blobPathname?: string | null;
  role: "GALLERY" | "HERO_CUTOUT" | "HERO_BACKGROUND" | "HERO_BACKGROUND_MOBILE" | "FEATURED_BACKGROUND" | "FEATURED_BACKGROUND_MOBILE" | "INGREDIENT_SHOWCASE" | "USAGE";
  focalX: number;
  focalY: number;
  isPrimary: boolean;
  sortOrder: number;
}

export interface AdminUsageSuggestionInput {
  id?: string;
  productImageId: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  active: boolean;
}

export interface AdminProductVariantInput {
  id?: string;
  sku: string;
  weightGrams: number;
  price: number;
  originalPrice?: number | null;
  stock: number;
  active: boolean;
  version?: number;
  expectedVersion?: number;
  stockReason?: string;
}

export interface AdminProductDetail {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  ingredients: string;
  usage: string;
  storageInstructions: string;
  origin: string;
  manufacturer: string;
  distributor: string;
  shelfLife: string;
  allergenWarning: string;
  nutritionInfo: string;
  bestSeller: boolean;
  active: boolean;
  updatedAt: string;
  images: AdminProductImageInput[];
  variants: AdminProductVariantInput[];
  suggestions: AdminUsageSuggestionInput[];
}

export interface AdminCategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  imageStorageProvider: "LOCAL" | "VERCEL_BLOB" | null;
  imageBlobPathname: string | null;
  sortOrder: number;
  active: boolean;
  productCount: number;
  updatedAt: string;
}

export interface AdminSettingsData {
  expectedRevision?: number;
  heroProductId: string | null;
  featuredProductId: string | null;
  homepageBestSellerLimit: number;
  freeShippingThreshold: number;
  defaultShippingFee: number;
  pendingOrderExpiryHours: number;
  orderPiiRetentionDays: number;
  orderAssetRetentionDays: number;
  announcementText: string;
  storeContact: {
    phone?: string;
    email?: string;
    address?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    amazonUrl?: string;
  };
}

export interface AdminPageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}
