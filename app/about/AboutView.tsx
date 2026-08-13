"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, BookOpenCheck, Layers3, UtensilsCrossed } from "lucide-react";

import { useT, type TranslationKey } from "@/lib/i18n/LocaleProvider";
import { Magnetic } from "@/components/shop/Magnetic";
import { PageHero } from "@/components/shop/PageHero";
import styles from "@/components/shop/pages.module.css";

const values = [
  { icon: Layers3, title: "about.value1.title", body: "about.value1.body" },
  { icon: UtensilsCrossed, title: "about.value2.title", body: "about.value2.body" },
  { icon: BookOpenCheck, title: "about.value3.title", body: "about.value3.body" },
] as const satisfies ReadonlyArray<{ icon: unknown; title: TranslationKey; body: TranslationKey }>;

export function AboutView() {
  const t = useT();

  return (
    <div className={styles.page} id="story">
      <PageHero
        image="/images/ingredients.webp"
        imageAlt={t("about.heroAlt")}
        label={t("about.eyebrow")}
        lead={t("about.lead")}
        priority
        title={t("about.title")}
      >
        <Link className="section-link" href="/#pasta-magic">
          {t("about.cta")} <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </PageHero>

      <section className={styles.pageBody} data-scene>
        <p className={styles.pageLabel} data-reveal="fade">{t("about.statementEyebrow")}</p>
        <h2 className={styles.statement} data-reveal="clip">{t("about.statementTitle")}</h2>
        <p className={styles.statementBody} data-lines>{t("about.statementBody")}</p>

        <ul aria-label={t("about.valuesLabel")} className={styles.valueRow}>
          {values.map(({ icon: Icon, title, body }, index) => (
            <li data-reveal key={title} style={{ "--i": index } as CSSProperties}>
              <Icon aria-hidden="true" size={28} strokeWidth={1.3} />
              <h2>{t(title)}</h2>
              <p>{t(body)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.kitchen} data-scene>
        <div className={styles.kitchenImage}>
          <Image alt={t("about.kitchenAlt")} data-parallax fill quality={75} sizes="100vw" src="/images/hero-pasta.webp" />
        </div>
        <span aria-hidden="true" className={styles.kitchenVeil} />
        <div className={styles.kitchenCopy}>
          <p className={styles.pageLabel} data-reveal="fade">{t("about.kitchenEyebrow")}</p>
          <h2 data-reveal="clip">{t("about.kitchenTitle")}</h2>
          <p data-reveal>{t("about.kitchenBody")}</p>
          <Magnetic><Link className="btn-primary" href="/recipes">{t("about.kitchenCta")}</Link></Magnetic>
        </div>
      </section>
    </div>
  );
}
