import type { ImageRole, Product, ProductImage, ProductVariant } from "@/types/domain";
import { CATALOG_IMAGE_PLACEHOLDER } from "@/lib/catalog-image";

export function imageForRole(product: Product, role: ImageRole): ProductImage | undefined {
  return product.images.find((image) => image.role === role);
}

export function primaryImage(product: Product): ProductImage {
  return (
    product.images.find((image) => image.isPrimary) ??
    product.images.find((image) => image.role === "GALLERY") ??
    product.images[0] ?? {
      id: `fallback-${product.id}`,
      url: CATALOG_IMAGE_PLACEHOLDER,
      // Just the name: this helper runs on the server as well, where there is
      // no locale context, and the name is already localised by the caller.
      // A hard-coded Japanese suffix here would leak into the English site.
      alt: product.name,
      role: "GALLERY"
    }
  );
}

export function activeVariants(product: Product): ProductVariant[] {
  return product.variants.filter((variant) => variant.active);
}

export function availableVariants(product: Product): ProductVariant[] {
  return activeVariants(product).filter((variant) => variant.stock > 0);
}

export function minimumPrice(product: Product): number {
  const prices = activeVariants(product).map((variant) => variant.price);
  return prices.length > 0 ? Math.min(...prices) : 0;
}

export function averageRating(product: Product): number | null {
  const approved = product.reviews.filter((review) => review.approved);
  if (approved.length === 0) return null;
  return approved.reduce((total, review) => total + review.rating, 0) / approved.length;
}

export function weightRange(product: Product): string {
  const weights = activeVariants(product)
    .map((variant) => variant.weightGrams)
    .sort((a, b) => a - b);

  if (weights.length === 0) return "";
  if (weights.length === 1) return `${weights[0]}g`;
  return `${weights[0]}g – ${weights[weights.length - 1]}g`;
}
