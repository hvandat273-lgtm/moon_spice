"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";

import { recipesByLocale, type Recipe } from "./data";

/**
 * Hooks live apart from the data on purpose. `data.ts` has to stay a plain
 * module because `generateStaticParams` imports it on the server, and a
 * "use client" module resolves there to a client reference rather than the
 * array itself.
 */

/** Every recipe in the active language. */
export function useRecipes(): Recipe[] {
  return recipesByLocale[useLocale().locale];
}

/** A single recipe in the active language, or undefined. */
export function useRecipe(slug: string): Recipe | undefined {
  return useRecipes().find((recipe) => recipe.slug === slug);
}
