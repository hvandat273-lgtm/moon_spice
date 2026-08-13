"use client";

import { useT } from "@/lib/i18n/LocaleProvider";
import { useChapterContent } from "@/lib/i18n/useChapterContent";

import styles from "./chapters.module.css";

/**
 * Fixed chapter index down the left edge, replacing the "02 / 06" counter that
 * the old design restated above every section.
 *
 * The active dot is driven entirely by CSS. Each chapter declares a
 * `view-timeline-name`, `body` puts those timelines in scope, and each dot
 * animates against the one it belongs to — so a `position: fixed` element
 * tracks the scroll progress of elements it is not related to in the DOM, with
 * no IntersectionObserver and no scroll listener. See chapters.module.css.
 */

export const CHAPTER_IDS = ["souvenir", "yude-theory", "chef", "ingredients", "how-to-cook", "usage"] as const;

export function ChapterRail() {
  const t = useT();
  const content = useChapterContent();

  const labels = [
    content.souvenir.meta.label,
    content.yude.meta.label,
    content.chef.meta.label,
    content.ingredients.meta.label,
    content.method.meta.label,
    t("usage.title"),
  ];

  return (
    <nav aria-label={t("rail.label")} className={styles.rail}>
      <ol>
        {CHAPTER_IDS.map((id, index) => (
          <li key={id}>
            <a href={`#${id}`} title={labels[index]}>
              <span aria-hidden="true" className={styles.railDot} />
              <span className={styles.railNumber}>{String(index + 1).padStart(2, "0")}</span>
              <span className="sr-only">{t("rail.goTo", { n: index + 1 })} — {labels[index]}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
