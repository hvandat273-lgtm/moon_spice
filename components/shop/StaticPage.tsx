"use client";

import type { ReactNode } from "react";

import { useLocale, useT } from "@/lib/i18n/LocaleProvider";

import { PageHero } from "./PageHero";
import styles from "./pages.module.css";

/**
 * Scaffolding for the two legal pages.
 *
 * Their bodies are Japanese in BOTH locales, deliberately: a machine
 * translation of a privacy policy or terms of use is not a privacy policy or
 * terms of use. On the English locale a notice explains that and points at the
 * contact page, rather than silently serving Japanese to an English reader.
 */
export function ContentPage({
  eyebrow,
  title,
  intro,
  image = "/images/ingredients.webp",
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  image?: string;
  children: ReactNode;
}) {
  const { locale } = useLocale();
  const t = useT();

  return (
    <div className={styles.page}>
      <PageHero image={image} imageAlt="" label={eyebrow} lead={intro} priority title={title} />
      <div className={styles.prose} data-scene>
        {locale === "en" ? <p className={styles.legalNotice}>{t("legal.notice")}</p> : null}
        {children}
      </div>
    </div>
  );
}

export function ProseSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.proseSection} data-reveal>
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}
