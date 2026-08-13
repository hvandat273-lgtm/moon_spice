import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { recipeSlugs, recipesByLocale } from "../data";
import { RecipeDetailView } from "./RecipeDetailView";

interface RecipeDetailProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return recipeSlugs.map((slug) => ({ slug }));
}

/** Metadata is Japanese in both locales: one URL, one indexable version. */
export async function generateMetadata({ params }: RecipeDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const recipe = recipesByLocale.ja.find((item) => item.slug === slug);
  if (!recipe) return { title: "レシピが見つかりません" };
  return {
    title: recipe.title,
    description: recipe.description,
    alternates: { canonical: `/recipes/${recipe.slug}` },
    openGraph: { images: [{ url: recipe.heroImage, alt: recipe.heroAlt }] }
  };
}

export default async function RecipeDetailPage({ params }: RecipeDetailProps) {
  const { slug } = await params;
  const recipe = recipesByLocale.ja.find((item) => item.slug === slug);
  if (!recipe) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const recipeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description,
    image: [new URL(recipe.heroImage, siteUrl).toString()],
    prepTime: `PT${recipe.prepMinutes}M`,
    recipeYield: `${recipe.servings}人分`,
    recipeIngredient: recipe.ingredients,
    recipeInstructions: recipe.steps.map((step) => ({ "@type": "HowToStep", text: step }))
  };

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeJsonLd).replace(/</g, "\\u003c") }} type="application/ld+json" />
      <RecipeDetailView slug={slug} />
    </>
  );
}
