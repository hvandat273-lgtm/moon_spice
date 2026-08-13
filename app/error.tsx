"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";

import { useT } from "@/lib/i18n/LocaleProvider";
import styles from "@/components/shop/pages.module.css";

export default function ErrorPage({ error }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useT();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <section className={styles.errorState}>
      <span aria-hidden="true">!</span>
      <p>{t("error.generic")}</p>
      <h1>{t("error.genericTitle")}</h1>
      <div>
        <button className="btn-primary" onClick={() => window.location.reload()} type="button">
          <RefreshCw aria-hidden="true" size={17} /> {t("error.retry")}
        </button>
        <Link className="btn-outline" href="/">
          <ArrowLeft aria-hidden="true" size={17} /> {t("error.home")}
        </Link>
      </div>
    </section>
  );
}
