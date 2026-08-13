"use client";

import Image from "next/image";
import Link from "next/link";
import { ViewTransition, type CSSProperties } from "react";
import { ArrowLeft, ChevronRight, Clock3, Users } from "lucide-react";

import { useT } from "@/lib/i18n/LocaleProvider";
import styles from "@/components/shop/pages.module.css";

import { useRecipe } from "../useRecipes";

export function RecipeDetailView({ slug }: { slug: string }) {
  const t = useT();
  const recipe = useRecipe(slug);

  // The server has already 404'd an unknown slug; this only covers the window
  // where a locale swap has not yet resolved.
  if (!recipe) return null;

  return (
    <article className={styles.page}>
      <nav aria-label={t("recipes.breadcrumb")} className={styles.breadcrumbs}>
        <Link href="/">{t("nav.home")}</Link>
        <ChevronRight aria-hidden="true" size={13} />
        <Link href="/recipes" transitionTypes={["nav-back"]}>{t("nav.recipes")}</Link>
        <ChevronRight aria-hidden="true" size={13} />
        <span aria-current="page">{recipe.title}</span>
      </nav>

      {/* Pairs with the card on /recipes, so the thumbnail grows into this
        * hero rather than the two images swapping. */}
      <ViewTransition default="none" name={`recipe-${recipe.slug}`} share="morph">
        <header className={styles.pageHero}>
          <div className={styles.pageHeroImage}>
            <Image
              alt={recipe.heroAlt}
              data-kenburns
              fetchPriority="high"
              fill
              loading="eager"
              sizes="100vw"
              src={recipe.heroImage}
              style={{ objectPosition: recipe.imagePosition }}
            />
          </div>
          <span aria-hidden="true" className={styles.pageHeroVeil} />
          <div className={styles.pageHeroCopy}>
            <p className={styles.pageLabel}>{t("recipes.eyebrow")}</p>
            <h1>{recipe.title}</h1>
            <p className={styles.pageLead}>{recipe.description}</p>
            <div className={styles.recipeMeta}>
              <span><Clock3 aria-hidden="true" size={16} /> {t("recipes.minutes", { n: recipe.prepMinutes })}</span>
              <span><Users aria-hidden="true" size={16} /> {t("recipes.servings", { n: recipe.servings })}</span>
            </div>
          </div>
        </header>
      </ViewTransition>

      <div className={styles.recipeBody}>
        <aside className={styles.recipeAside}>
          <h2>{t("recipes.ingredients")}</h2>
          <ul>
            {recipe.ingredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}
          </ul>
          <Link href="/#pasta-magic">{t("recipes.productLink")}</Link>
        </aside>

        <section className={styles.recipeSteps}>
          <p className={styles.pageLabel}>{t("recipes.stepsEyebrow")}</p>
          <h2>{t("recipes.stepsTitle")}</h2>
          <ol>
            {recipe.steps.map((step, index) => (
              <li data-reveal key={step} style={{ "--i": index } as CSSProperties}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <Link className={styles.backLink} href="/recipes" transitionTypes={["nav-back"]}>
        <ArrowLeft aria-hidden="true" size={16} /> {t("recipes.back")}
      </Link>
    </article>
  );
}
