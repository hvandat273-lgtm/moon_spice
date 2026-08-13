"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, CookingPot, Quote, UtensilsCrossed } from "lucide-react";

import { formatWeight } from "@/lib/format";
import type { Product } from "@/types/domain";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useChapterContent } from "@/lib/i18n/useChapterContent";
import { useLocalizedProduct } from "@/lib/i18n/useLocalizedProduct";

import { SALINITY_FILL, SALINITY_VALUE, showFormulation, type ChapterMeta } from "./deck-content";
import { Magnetic } from "./Magnetic";
import { activeVariants, imageForRole } from "./product-utils";
import styles from "./chapters.module.css";

/**
 * The six chapters.
 *
 * Each one is a full-viewport scene with its own composition. There is no
 * shared section header any more: the old design opened every chapter with the
 * same olive rule, numbered kicker, page counter and italic subtitle, which
 * made six different subjects look like six printings of one page. Chapter
 * numbering now lives once, in the fixed rail.
 *
 * What is shared is only the eyebrow/title pair, and even that is positioned
 * differently in each scene.
 */
function ChapterTitle({ meta, titleId, tone }: { meta: ChapterMeta; titleId: string; tone?: "compact" }) {
  return (
    <header className={tone === "compact" ? `${styles.chapterTitle} ${styles.chapterTitleCompact}` : styles.chapterTitle}>
      <p className={styles.chapterLabel}>{meta.label}</p>
      <h2 data-reveal="clip" id={titleId}>{meta.title}</h2>
      <p className={styles.chapterSub} data-reveal="fade">{meta.subtitle}</p>
    </header>
  );
}

/* -- 01 ------------------------------------------------------------------- */

/** Split scene: the pack bleeds off the left edge, the argument runs right. */
export function SouvenirChapter() {
  const { souvenir } = useChapterContent();

  return (
    <section aria-labelledby="souvenir-title" className={`chapter ${styles.souvenir}`} data-scene id="souvenir">
      <div className={styles.souvenirGrid}>
        <div className={styles.souvenirPack} data-parallax>
          <Image
            alt={souvenir.image.alt}
            height={1254}
            quality={100}
            sizes="(max-width: 63.99rem) 60vw, 38vw"
            src={souvenir.image.src}
            width={1254}
          />
          <p className={styles.souvenirCaption}>{souvenir.image.caption}</p>
        </div>

        <div className={styles.souvenirBody}>
          <ChapterTitle meta={souvenir.meta} titleId="souvenir-title" />
          <p className={styles.souvenirLead} data-reveal>{souvenir.lead}</p>
          <p className={styles.souvenirText} data-lines>{souvenir.body}</p>

          <ul className={styles.featureRow}>
            {souvenir.features.map((feature, index) => (
              <li data-reveal key={feature.index} style={{ "--i": index } as CSSProperties}>
                <span aria-hidden="true" className={styles.featureIndex}>{feature.index}</span>
                <p className={styles.featureKicker}>{feature.kicker}</p>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </li>
            ))}
          </ul>

          {/* The chapter's punchline, given a line of its own. */}
          <aside className={styles.proposal} data-reveal>
            <p className={styles.proposalLabel}>{souvenir.proposalLabel}</p>
            <p className={styles.proposalText}>{souvenir.proposal}</p>
          </aside>

          <p className="chapter-note">{souvenir.note}</p>
        </div>
      </div>
    </section>
  );
}

/* -- 02 ------------------------------------------------------------------- */

/**
 * Three floor-to-ceiling columns whose liquid level IS the salinity figure.
 * The old design put the same numbers in three horizontal cards with 4px
 * meters; standing them up makes 1.0 / 2.5 / 0 readable at a glance without
 * reading the numerals at all.
 */
export function YudeChapter() {
  const { yude } = useChapterContent();

  return (
    <section aria-labelledby="yude-title" className={`chapter ${styles.yude}`} data-scene id="yude-theory">
      <div className={styles.yudeColumns} aria-hidden="true">
        {yude.columns.map((column) => (
          <div
            className={column.id === "okuda" ? `${styles.tube} ${styles.tubeFeatured}` : styles.tube}
            key={column.id}
            style={{ "--fill-target": SALINITY_FILL[column.id] } as CSSProperties}
          >
            <span className={styles.tubeLiquid} data-fill-y />
          </div>
        ))}
      </div>

      <div className={`chapter-inner ${styles.yudeInner}`}>
        <ChapterTitle meta={yude.meta} titleId="yude-title" />

        <blockquote className={styles.yudeQuote} data-reveal="clip">
          <Quote aria-hidden="true" size={26} strokeWidth={1.6} />
          <p data-lines>{yude.quote}</p>
        </blockquote>

        <dl className={styles.yudeReadout}>
          {yude.columns.map((column, index) => (
            <div
              className={column.id === "okuda" ? styles.readoutFeatured : undefined}
              data-reveal
              key={column.id}
              style={{ "--i": index } as CSSProperties}
            >
              <dt>
                <span className={styles.readoutKicker}>{column.kicker}</span>
                {column.title}
              </dt>
              <dd>
                <p className={styles.readoutValue}>
                  <span>{SALINITY_VALUE[column.id].value}</span>
                  <small>{SALINITY_VALUE[column.id].unit}</small>
                </p>
                <p className={styles.readoutCaption}>{column.caption}</p>
                <p className={styles.readoutBody}>{column.body}</p>
              </dd>
            </div>
          ))}
        </dl>

        <p className="chapter-note">{yude.source}</p>
      </div>
    </section>
  );
}

/* -- 03 ------------------------------------------------------------------- */

/** Portrait bleeds the right half; the name crosses onto it from the left. */
export function ChefChapter() {
  const { chef } = useChapterContent();

  return (
    <section aria-labelledby="chef-title" className={`chapter ${styles.chef}`} data-scene id="chef">
      <div className={styles.chefPortrait}>
        <Image
          alt={chef.portrait.alt}
          fill
          quality={100}
          sizes="(max-width: 63.99rem) 100vw, 52vw"
          src={chef.portrait.src}
          style={{ objectFit: "cover", objectPosition: "50% 22%" }}
        />
        <span aria-hidden="true" className={styles.chefScrim} />
        <p className={styles.chefCaption}>{chef.portrait.caption}</p>
      </div>

      <div className={styles.chefCopy}>
        <ChapterTitle meta={chef.meta} titleId="chef-title" />
        <p className={styles.chefLead} data-reveal>{chef.lead}</p>
        <p className={styles.chefBio} data-lines>{chef.biography}</p>

        <div className={styles.timeline}>
          <span aria-hidden="true" className={styles.timelineSpine} data-draw />
          <h3>{chef.highlightsLabel}</h3>
          <ol>
            {chef.highlights.map((item, index) => (
              <li data-reveal key={item.year} style={{ "--i": index } as CSSProperties}>
                <span className={styles.timelineYear}>{item.year}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* -- 04 ------------------------------------------------------------------- */

/**
 * The seven ingredients as a constellation over the full-bleed photograph, and
 * the three figures as oversized numerals across the foot of the scene.
 */
export function IngredientsChapter() {
  const { ingredients } = useChapterContent();
  const count = ingredients.items.length;

  return (
    <section aria-labelledby="ingredients-title" className={`chapter ${styles.ingredients}`} data-scene id="ingredients">
      <div aria-hidden="true" className={styles.ingredientsBackdrop}>
        <Image alt="" fill quality={75} sizes="100vw" src={ingredients.image.src} style={{ objectFit: "cover" }} />
        <span className={styles.ingredientsVeil} />
      </div>

      <div className={`chapter-inner ${styles.ingredientsInner}`}>
        <ChapterTitle meta={ingredients.meta} titleId="ingredients-title" tone="compact" />

        <div className={styles.constellation}>
          {/* Decorative: the ordered list beside it is the real content. */}
          <div aria-hidden="true" className={styles.constellationRing} data-spin>
            {ingredients.items.map((item, index) => (
              <span
                className={styles.node}
                key={item.name}
                style={{
                  "--angle": `${(360 / count) * index}deg`,
                  "--swatch": item.swatch,
                } as CSSProperties}
              />
            ))}
          </div>

          <ul className={styles.composition}>
            <li className={styles.compositionLabel}>{ingredients.listLabel}</li>
            {ingredients.items.map((item, index) => (
              <li data-reveal="fade" key={item.name} style={{ "--i": index } as CSSProperties}>
                <span aria-hidden="true" className={styles.swatch} style={{ background: item.swatch }} />
                <span>{item.name}</span>
                {showFormulation && item.grams ? <span className={styles.grams}>{item.grams}g</span> : null}
              </li>
            ))}
          </ul>
        </div>

        <dl className={styles.statRow}>
          {ingredients.stats.map((stat, index) => (
            <div data-reveal="clip" key={stat.label} style={{ "--i": index } as CSSProperties}>
              <dd><span>{stat.value}</span><small>{stat.unit}</small></dd>
              <dt>{stat.label}</dt>
            </div>
          ))}
        </dl>

        <p className="chapter-note">{ingredients.note}</p>
      </div>
    </section>
  );
}

/* -- 05 ------------------------------------------------------------------- */

/** Sticky scrub: the quantities hold still while the five steps pass. */
export function MethodChapter() {
  const { method } = useChapterContent();

  return (
    <section aria-labelledby="method-title" className={styles.method} id="how-to-cook">
      <div className={styles.methodGrid}>
        <aside className={styles.methodAside}>
          <ChapterTitle meta={method.meta} titleId="method-title" tone="compact" />

          <section className={styles.methodBlock}>
            <h3><CookingPot aria-hidden="true" size={17} strokeWidth={1.5} /> {method.equipmentLabel}</h3>
            <ul className={styles.equipmentList}>
              {method.equipment.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>

          <section className={styles.methodBlock}>
            <h3><UtensilsCrossed aria-hidden="true" size={17} strokeWidth={1.5} /> {method.ingredientsLabel}</h3>
            <dl className={styles.quantityList}>
              {method.ingredients.map((item) => (
                <div className={item.highlight ? styles.quantityHighlight : undefined} key={item.name}>
                  <dt>{item.name}</dt>
                  <dd>{item.amount}</dd>
                </div>
              ))}
            </dl>
          </section>

          <Link className={styles.methodLink} href="/recipes">
            {method.recipeLink} <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </aside>

        <div className={styles.methodSteps}>
          <p className={styles.methodStepsLabel}>{method.methodLabel}</p>
          <ol>
            {method.steps.map((step, index) => (
              <li
                className={index === method.steps.length - 1 ? styles.stepFinal : undefined}
                data-reveal
                key={step.no}
                style={{ "--i": index } as CSSProperties}
              >
                <span aria-hidden="true" className={styles.stepNumber}>{step.no}</span>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
          <p className="chapter-note">{method.tip}</p>
        </div>
      </div>
    </section>
  );
}

/* -- 06 ------------------------------------------------------------------- */

/**
 * Four plates filling the viewport. The unfurl primitive is unchanged from the
 * previous pass — see `[data-fan]` and the `--fan-offset` note in
 * chapters.module.css.
 */
export function UsageChapter({ product: source }: { product: Product }) {
  const t = useT();
  const product = useLocalizedProduct(source);
  const suggestions = product.usageSuggestions.slice(0, 4);

  return (
    <section aria-labelledby="usage-title" className={`chapter ${styles.usage}`} data-scene id="usage">
      <div className={`chapter-inner ${styles.usageInner}`}>
        <header className={`${styles.chapterTitle} ${styles.chapterTitleCompact}`}>
          <p className={styles.chapterLabel}>Suggested Uses</p>
          <h2 data-reveal="clip" id="usage-title">{t("usage.title")}</h2>
          <p className={styles.chapterSub} data-reveal="fade">{t("usage.sub")}</p>
        </header>

        {suggestions.length > 0 ? (
          <div className={styles.plateGrid}>
            {suggestions.map((suggestion) => (
              <figure data-fan key={suggestion.id}>
                <Image
                  alt={suggestion.image.alt || suggestion.title}
                  fill
                  sizes="(max-width: 47.99rem) 46vw, 22vw"
                  src={suggestion.image.url}
                  style={{ objectPosition: [suggestion.image.focalX ?? 50, suggestion.image.focalY ?? 50].join("% ") + "%" }}
                />
                <figcaption>{suggestion.title}</figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className={styles.usageFallback}>{product.usage || t("usage.fallback")}</p>
        )}

        <Link className="section-link" href="/recipes">
          {t("usage.link")} <ArrowRight aria-hidden="true" size={15} />
        </Link>
      </div>
    </section>
  );
}

/* -- Closing call to action ------------------------------------------------ */

export function FinalCta({ product: source }: { product: Product }) {
  const t = useT();
  const product = useLocalizedProduct(source);
  const scene = imageForRole(product, "FEATURED_BACKGROUND");
  const firstVariant = activeVariants(product)[0];

  return (
    <section aria-labelledby="featured-title" className={styles.finalCta}>
      {scene ? (
        <div aria-hidden="true" className={styles.finalCtaScene}>
          <Image alt="" data-kenburns fill quality={75} sizes="100vw" src={scene.url} />
          <span className={styles.finalCtaVeil} />
        </div>
      ) : null}
      <div className={`chapter-inner ${styles.finalCtaCopy}`}>
        <p className="eyebrow" data-reveal="fade">{t("featured.eyebrow")}</p>
        <h2 data-reveal="clip" id="featured-title">{product.name}</h2>
        <p data-reveal>{product.shortDescription}</p>
        {firstVariant ? (
          <p className={styles.finalCtaWeight}>{t("featured.weight", { weight: formatWeight(firstVariant.weightGrams) })}</p>
        ) : null}
        <Magnetic><Link className="btn-primary" href="/recipes">{t("featured.cta")}</Link></Magnetic>
      </div>
    </section>
  );
}
