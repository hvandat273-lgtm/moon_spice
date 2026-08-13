"use client";

import { useMemo } from "react";

import type { Product } from "@/types/domain";

import catalogOverrides from "./dictionaries/en-catalog.json";
import { useLocale } from "./LocaleProvider";

interface ProductOverride {
  name?: string;
  categoryName?: string;
  shortDescription?: string;
  description?: string;
  ingredients?: string;
  usage?: string;
  storageInstructions?: string;
  origin?: string;
  manufacturer?: string;
  distributor?: string;
  shelfLife?: string;
  allergenWarning?: string;
  nutritionInfo?: string;
  usageSuggestions?: Record<string, string>;
}

const overrides = catalogOverrides.products as Record<string, ProductOverride | undefined>;

/**
 * Catalogue data is admin-editable and stores a single language. Rather than
 * add locale fields to the domain model and the admin form — which are out of
 * scope for this redesign — the `en` locale looks its copy up in
 * `dictionaries/en-catalog.json`, keyed by product slug.
 *
 * Anything without an entry falls back to whatever the catalogue holds, so a
 * newly added product is never blank in English, only untranslated. If an
 * admin edits a field, the Japanese changes immediately and the English
 * override keeps serving until someone updates it — visible staleness rather
 * than silent divergence.
 */
export function useLocalizedProduct(product: Product): Product {
  const { locale } = useLocale();

  return useMemo(() => {
    if (locale !== "en") return product;
    const override = overrides[product.slug];
    if (!override) return product;

    const usageMap = override.usageSuggestions ?? {};
    return {
      ...product,
      name: override.name ?? product.name,
      categoryName: override.categoryName ?? product.categoryName,
      shortDescription: override.shortDescription ?? product.shortDescription,
      description: override.description ?? product.description,
      ingredients: override.ingredients ?? product.ingredients,
      usage: override.usage ?? product.usage,
      storageInstructions: override.storageInstructions ?? product.storageInstructions,
      origin: override.origin ?? product.origin,
      manufacturer: override.manufacturer ?? product.manufacturer,
      distributor: override.distributor ?? product.distributor,
      shelfLife: override.shelfLife ?? product.shelfLife,
      allergenWarning: override.allergenWarning ?? product.allergenWarning,
      nutritionInfo: override.nutritionInfo ?? product.nutritionInfo,
      usageSuggestions: product.usageSuggestions.map((suggestion) => ({
        ...suggestion,
        title: usageMap[suggestion.title] ?? suggestion.title,
      })),
    };
  }, [locale, product]);
}
