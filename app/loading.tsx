"use client";

import { useT } from "@/lib/i18n/LocaleProvider";
import styles from "@/components/shop/pages.module.css";

export default function Loading() {
  const t = useT();
  return (
    <div aria-busy="true" aria-label={t("error.loading")} className={styles.loadingState} role="status">
      <div className={styles.loadingHero} />
      <div className={styles.loadingGrid}>
        {Array.from({ length: 4 }, (_, index) => (
          <div className={styles.loadingCard} key={index} />
        ))}
      </div>
      <span className="sr-only">{t("error.loadingSr")}</span>
    </div>
  );
}
