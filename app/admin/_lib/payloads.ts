import type { CategoryMutationInput, ProductMutationInput } from "@/lib/server/admin";

import { adminCategorySchema, adminProductSchema } from "./validation";

export function backendProduct(input: ReturnType<typeof adminProductSchema.parse>, id?: string): ProductMutationInput {
  return {
    ...(id ? { id } : {}),
    expectedUpdatedAt: input.expectedUpdatedAt,
    categoryId: input.categoryId,
    name: input.name,
    slug: input.slug,
    shortDescription: input.shortDescription,
    description: input.description,
    ingredients: input.ingredients || null,
    usage: input.usage || null,
    storageInstructions: input.storageInstructions || null,
    origin: input.origin || null,
    manufacturer: input.manufacturer || null,
    distributor: input.distributor || null,
    shelfLife: input.shelfLife || null,
    allergenWarning: input.allergenWarning || null,
    nutritionInfo: input.nutritionInfo || null,
    bestSeller: input.bestSeller,
    active: input.active,
    variants: input.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      weightGrams: variant.weightGrams,
      price: variant.price,
      originalPrice: variant.originalPrice,
      stock: variant.stock,
      active: variant.active,
      expectedVersion: variant.expectedVersion,
      stockReason: variant.stockReason,
    })),
    images: input.images.map((image) => ({
      id: image.id,
      url: image.url,
      storageProvider: image.storageProvider,
      blobPathname: image.blobPathname,
      role: image.role,
      alt: image.alt,
      focalX: image.focalX,
      focalY: image.focalY,
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
    })),
    suggestions: input.suggestions.map((suggestion) => ({
      id: suggestion.id,
      productImageId: suggestion.productImageId,
      title: suggestion.title,
      description: suggestion.description,
      sortOrder: suggestion.sortOrder,
      active: suggestion.active,
    })),
  };
}

export function backendCategory(input: ReturnType<typeof adminCategorySchema.parse>, id?: string): CategoryMutationInput {
  const imageUrl = input.imageUrl || null;
  return {
    ...(id ? { id } : {}),
    expectedUpdatedAt: input.expectedUpdatedAt,
    name: input.name,
    slug: input.slug,
    description: input.description || null,
    imageUrl,
    imageAlt: input.imageAlt || null,
    imageStorageProvider: imageUrl ? input.imageStorageProvider : null,
    imageBlobPathname: imageUrl ? input.imageBlobPathname : null,
    sortOrder: input.sortOrder,
    active: input.active,
  };
}
