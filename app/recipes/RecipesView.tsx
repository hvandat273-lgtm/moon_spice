"use client";

import Image from "next/image";
import Link from "next/link";
import { ViewTransition, type CSSProperties } from "react";
import { ArrowRight, Clock3, Users } from "lucide-react";

import { useT } from "@/lib/i18n/LocaleProvider";
import { PageHero } from "@/components/shop/PageHero";
import styles from "@/components/shop/pages.module.css";

import { useRecipes } from "./useRecipes";

export function RecipesView() {
  const t = useT();
  const recipes = useRecipes();

  return (
    <div className={styles.page}>
      <PageHero
        image="/images/usage-01.webp"
        imageAlt=""
        label={t("recipes.eyebrow")}
        lead={t("recipes.lead")}
        priority
        title={t("recipes.title")}
      />

      <section className={styles.pageBody}>
        <div className={styles.recipeList}>
          {recipes.map((recipe, index) => (
            <article className={styles.recipeCard} data-reveal key={recipe.slug} style={{ "--i": index } as CSSProperties}>
              <Link className={styles.recipeCardImage} href={`/recipes/${recipe.slug}`} transitionTypes={["nav-forward"]}>
                {/* Morphs into the hero on the detail page. */}
                <ViewTransition default="none" name={`recipe-${recipe.slug}`} share="morph">
                  <Image
                    alt={recipe.heroAlt}
                    fill
                    loading={index === 0 ? "eager" : "lazy"}
                    sizes="(max-width: 47.99rem) 100vw, 40vw"
                    src={recipe.heroImage}
                    style={{ objectPosition: recipe.imagePosition }}
                  />
                </ViewTransition>
              </Link>
              <div className={styles.recipeCardBody}>
                <div className={styles.recipeMeta}>
                  <span><Clock3 aria-hidden="true" size={15} /> {t("recipes.minutes", { n: recipe.prepMinutes })}</span>
                  <span><Users aria-hidden="true" size={15} /> {t("recipes.servings", { n: recipe.servings })}</span>
                </div>
                <h2><Link href={`/recipes/${recipe.slug}`}>{recipe.title}</Link></h2>
                <p>{recipe.description}</p>
                <Link className="card-link" href={`/recipes/${recipe.slug}`}>
                  {t("recipes.view")} <ArrowRight aria-hidden="true" size={15} />
                </Link>
              </div>
            </article>
          ))}
          {recipes.length === 0 ? (
            <div className={styles.noResults}>
              <h2>{t("recipes.emptyTitle")}</h2>
              <p>{t("recipes.emptyBody")}</p>
              <Link className="btn-outline" href="/">{t("recipes.emptyCta")}</Link>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
