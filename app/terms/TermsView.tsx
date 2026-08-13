"use client";

import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { legalContent } from "@/lib/i18n/legal";
import { ContentPage, ProseSection } from "@/components/shop/StaticPage";

export function TermsView() {
  const t = useT();
  const { locale } = useLocale();

  return (
    <ContentPage
      eyebrow={t("legal.termsEyebrow")}
      title={t("legal.termsTitle")}
      intro={t("legal.termsIntro")}
    >
      {legalContent[locale].terms.map((section) => (
        <ProseSection key={section.title} title={section.title}>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </ProseSection>
      ))}
    </ContentPage>
  );
}
