"use client";

import { useT } from "@/lib/i18n/LocaleProvider";

/** Its own component purely so the root layout can stay a Server Component. */
export function SkipLink() {
  const t = useT();
  return (
    <a className="skip-link" href="#main-content">
      {t("nav.skip")}
    </a>
  );
}
