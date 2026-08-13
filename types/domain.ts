export type ImageRole =
  | "GALLERY"
  | "HERO_CUTOUT"
  | "HERO_BACKGROUND"
  | "HERO_BACKGROUND_MOBILE"
  | "FEATURED_BACKGROUND"
  | "FEATURED_BACKGROUND_MOBILE"
  | "INGREDIENT_SHOWCASE"
  | "USAGE";

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  role: ImageRole;
  isPrimary?: boolean;
  focalX?: number;
  focalY?: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  weightGrams: number;
  price: number;
  originalPrice?: number | null;
  stock: number;
  active: boolean;
  version?: number;
}

export interface UsageSuggestion {
  id: string;
  title: string;
  description?: string;
  image: ProductImage;
  sortOrder: number;
}

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  content: string;
  reviewedAt: string;
  approved: boolean;
  source: "VERIFIED" | "IMPORTED" | "DEMO";
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  active: boolean;
  sortOrder: number;
}

export interface Product {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  ingredients?: string;
  usage?: string;
  storageInstructions?: string;
  origin?: string;
  manufacturer?: string;
  distributor?: string;
  shelfLife?: string;
  allergenWarning?: string;
  nutritionInfo?: string;
  bestSeller: boolean;
  active: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
  usageSuggestions: UsageSuggestion[];
  reviews: Review[];
}

export interface CartItem {
  productId: string;
  variantId: string;
  sku: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  weightGrams: number;
  stock: number;
}

export interface ShippingPolicy {
  freeShippingThreshold: number;
  defaultShippingFee: number;
}
