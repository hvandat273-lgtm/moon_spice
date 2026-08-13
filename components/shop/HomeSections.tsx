"use client";

import Link from "next/link";
import { useRef, type CSSProperties } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

import type { Product } from "@/types/domain";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useLocalizedProduct } from "@/lib/i18n/useLocalizedProduct";

import { Magnetic } from "./Magnetic";
import { imageForRole, primaryImage } from "./product-utils";
import { usePointerVars } from "./usePointerVars";
import hero from "./hero.module.css";

const WORDMARK = "MOOR SPICE";
/** Split per word so a line break can only ever fall between words, then per
 * character so each letter can carry its own entrance offset. */
const WORDMARK_WORDS = WORDMARK.split(" ").map((word, wordIndex, words) => ({
  word,
  offset: words.slice(0, wordIndex).reduce((total, previous) => total + previous.length, 0),
}));

/**
 * The hero composition stands the pouch in front of the wordmark, so it needs
 * a transparent source — a rectangular photo would paste a cream block over
 * the letters and kill the depth. This file is the stock packshot with its
 * flat background removed.
 *
 * If an admin has uploaded their own hero cutout, that wins: the layout still
 * works with an opaque image, it just reads as a card rather than a float.
 */
export function HeroProduct({ product: source }: { product: Product }) {
  const t = useT();
  const product = useLocalizedProduct(source);
  const heroRef = useRef<HTMLElement>(null);

  usePointerVars(
    heroRef,
    ({ x, y, rect }) => {
      const horizontal = (x - rect.left) / rect.width - 0.5;
      const vertical = (y - rect.top) / rect.height - 0.5;

      return {
        "--hero-shift-x": `${(-horizontal * 18).toFixed(2)}px`,
        "--hero-shift-y": `${(-vertical * 12).toFixed(2)}px`,
        "--hero-bloom-x": `${(horizontal * 26).toFixed(2)}px`,
        "--hero-bloom-y": `${(vertical * 18).toFixed(2)}px`,
        "--hero-seal-x": `${(horizontal * 8).toFixed(2)}px`,
        "--hero-seal-y": `${(vertical * 6).toFixed(2)}px`,
      };
    },
    {
      "--hero-shift-x": "0px",
      "--hero-shift-y": "0px",
      "--hero-bloom-x": "0px",
      "--hero-bloom-y": "0px",
      "--hero-seal-x": "0px",
      "--hero-seal-y": "0px",
    },
    { flag: "looking" },
  );
  // Use the complete hero photograph as one layer. The pouch, tabletop and
  // pasta scene are already composited, so there is no cutout edge to alias.
  const scene = imageForRole(product, "HERO_BACKGROUND")
    ?? imageForRole(product, "INGREDIENT_SHOWCASE")
    ?? primaryImage(product);
  const mobileScene = imageForRole(product, "HERO_BACKGROUND_MOBILE") ?? scene;

  return (
    <section aria-labelledby="hero-title" className={hero.hero} id="pasta-magic" ref={heroRef}>
      {/* Depth runs back to front: an ambient photograph, the wordmark, then
        * the product standing in front of the letters and occluding them.
        * Occlusion is what sells the depth. The tilt and the contact shadow
        * only sharpen something the stacking order already established. */}
      <div
        className={hero.heroAmbient}
        data-parallax
        style={{
          "--hero-focal-x": `${scene.focalX ?? 54}%`,
          "--hero-focal-y": `${scene.focalY ?? 50}%`,
          "--hero-mobile-focal-x": `${mobileScene.focalX ?? 62}%`,
          "--hero-mobile-focal-y": `${mobileScene.focalY ?? scene.focalY ?? 50}%`,
        } as CSSProperties}
      >
        <picture className={hero.heroAmbientPicture}>
          {/* This critical WebP is served directly so rendering never depends
            * on a client-side image optimizer calculation or its cache. */}
          <source media="(min-width: 48rem)" srcSet={scene.url} />
          <source media="(max-width: 47.99rem)" srcSet={mobileScene.url} />
          <img
            alt=""
            className={hero.heroAmbientImage}
            decoding="async"
            fetchPriority="high"
            height={1200}
            src={mobileScene.url}
            width={900}
          />
        </picture>
        {/* A restrained, CSS-rendered cinematic pass gives the still life a
          * dimensional camera movement without shipping a multi-megabyte
          * autoplay video. It lives behind the veil and never competes with
          * copy or controls. */}
        <span aria-hidden="true" className={hero.heroCinematicLight} />
        <span aria-hidden="true" className={hero.heroCinematicBloom} />
      </div>
      <div aria-hidden="true" className={hero.heroVeil} />

      <div className={hero.heroStage}>
        <div className={hero.heroCopy}>
          <p className={hero.heroEyebrow}>{product.categoryName}</p>

          <h1 aria-label={WORDMARK} className={hero.heroWordmark} id="hero-title">
            {WORDMARK_WORDS.map(({ word, offset }) => (
              <span aria-hidden="true" className={hero.heroWord} key={word}>
                {Array.from(word).map((character, index) => (
                  <span data-hero-char key={`${character}-${index}`} style={{ "--i": offset + index } as CSSProperties}>
                    {character}
                  </span>
                ))}
              </span>
            ))}
          </h1>

          <div className={hero.heroLedger}>
            <div className={hero.heroLedgerName}>
              <span aria-hidden="true" className={hero.heroRule} />
              <p className={hero.heroProductName}>{product.name}</p>
            </div>
            <p className={hero.heroDescription}>{product.shortDescription}</p>
            <div className={hero.heroActions}>
              <Magnetic><Link className="btn-primary" href="#ingredients">{t("hero.ctaIngredients")}</Link></Magnetic>
              <Link className="text-link" href="/recipes">
                {t("hero.ctaRecipes")} <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
            <p className={hero.heroAsideNote}>{t("hero.note", { name: product.name })}</p>
          </div>
        </div>

        <div className={hero.heroSeal}>
          {/* Tick ring turns with the scroll rather than spinning on its own. */}
          <svg aria-hidden="true" className={hero.heroSealRing} data-spin viewBox="0 0 120 120">
            <circle cx="60" cy="60" pathLength="120" r="56" />
          </svg>
          <Sparkles aria-hidden="true" size={20} strokeWidth={1.2} />
          <span>PASTA MAGIC</span>
          <small>{t("hero.sealTagline")}</small>
        </div>
      </div>

      <span aria-hidden="true" className={hero.heroScrollCue} data-scroll-fade />
    </section>
  );
}
