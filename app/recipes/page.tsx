import type { Metadata } from "next";

import { getMeta } from "@/lib/i18n/server";

import { RecipesView } from "./RecipesView";

export async function generateMetadata(): Promise<Metadata> {
  const m = await getMeta();
  return {
    title: m["meta.recipesTitle"],
    description: m["meta.recipesDescription"],
    alternates: { canonical: "/recipes" },
  };
}

export default function RecipesPage() {
  return <RecipesView />;
}
