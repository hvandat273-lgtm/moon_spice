"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";

import { useT } from "@/lib/i18n/LocaleProvider";
import styles from "@/components/shop/pages.module.css";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  return (
    <section className={styles.errorState}>
      <span aria-hidden="true">!</span>
      <p>{t("error.generic")}</p>
      <h1>{t("error.genericTitle")}</h1>
      <div>
        <button className="btn-primary" onClick={reset} type="button">
          <RefreshCw aria-hidden="true" size={17} /> {t("error.retry")}
        </button>
        <Link className="btn-outline" href="/">
          <ArrowLeft aria-hidden="true" size={17} /> {t("error.home")}
        </Link>
      </div>
    </section>
  );
}
