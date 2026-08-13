"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { ChevronDown, Mail } from "lucide-react";

import { useT, type TranslationKey } from "@/lib/i18n/LocaleProvider";
import { PageHero } from "@/components/shop/PageHero";
import styles from "@/components/shop/pages.module.css";

const groups = [
  { title: "faq.g1.title", items: [["faq.g1.q1", "faq.g1.a1"], ["faq.g1.q2", "faq.g1.a2"], ["faq.g1.q3", "faq.g1.a3"]] },
  { title: "faq.g2.title", items: [["faq.g2.q1", "faq.g2.a1"], ["faq.g2.q2", "faq.g2.a2"], ["faq.g2.q3", "faq.g2.a3"]] },
] as const satisfies ReadonlyArray<{ title: TranslationKey; items: ReadonlyArray<readonly [TranslationKey, TranslationKey]> }>;

export function FaqView() {
  const t = useT();

  return (
    <div className={styles.page}>
      <PageHero
        image="/images/hero-pasta.webp"
        imageAlt=""
        label={t("faq.eyebrow")}
        lead={t("faq.lead")}
        priority
        title={t("faq.title")}
      />

      <div className={styles.faqLayout}>
        <div>
          {groups.map((group, index) => (
            <section className={styles.faqGroup} data-reveal key={group.title} style={{ "--i": index } as CSSProperties}>
              <h2>{t(group.title)}</h2>
              <div>
                {group.items.map(([question, answer]) => (
                  <details key={question}>
                    <summary>
                      {t(question)} <ChevronDown aria-hidden="true" size={19} />
                    </summary>
                    <p>{t(answer)}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className={styles.aside}>
          <Mail aria-hidden="true" size={26} strokeWidth={1.3} />
          <h2>{t("faq.asideTitle")}</h2>
          <p>{t("faq.asideBody")}</p>
          <Link href="/contact">{t("faq.asideCta")}</Link>
        </aside>
      </div>
    </div>
  );
}
