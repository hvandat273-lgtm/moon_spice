"use client";

import Link from "next/link";

import { useT } from "@/lib/i18n/LocaleProvider";

/** Shown when the catalogue has no publishable product yet. */
export function EmptyCatalogNotice() {
  const t = useT();

  return (
    <section className="site-container" style={{ display: "grid", minHeight: "58vh", placeItems: "center", padding: "5rem 0", textAlign: "center" }}>
      <div>
        <p className="eyebrow">{t("home.emptyEyebrow")}</p>
        <h1 className="section-title" style={{ marginTop: "0.75rem" }}>{t("home.emptyTitle")}</h1>
        <p className="muted" style={{ margin: "1rem auto 0", maxWidth: "36rem" }}>{t("home.emptyBody")}</p>
        <Link className="btn-primary" href="/contact" style={{ marginTop: "1.75rem" }}>{t("nav.contact")}</Link>
      </div>
    </section>
  );
}
