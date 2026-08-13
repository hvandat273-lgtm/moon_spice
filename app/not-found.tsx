"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { useT } from "@/lib/i18n/LocaleProvider";
import styles from "@/components/shop/pages.module.css";

export default function NotFound() {
  const t = useT();
  return (
    <section className={styles.errorState}>
      <span aria-hidden="true">404</span>
      <p>{t("error.404")}</p>
      <h1>{t("error.404Title")}</h1>
      <div>
        <Link className="btn-primary" href="/">
          <ArrowLeft aria-hidden="true" size={17} /> {t("error.home")}
        </Link>
      </div>
    </section>
  );
}
