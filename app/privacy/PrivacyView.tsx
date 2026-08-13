"use client";

import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { legalContent } from "@/lib/i18n/legal";
import { ContentPage, ProseSection } from "@/components/shop/StaticPage";

export function PrivacyView() {
  const t = useT();
  const { locale } = useLocale();

  return (
    <ContentPage
      eyebrow={t("legal.privacyEyebrow")}
      title={t("legal.privacyTitle")}
      intro={t("legal.privacyIntro")}
    >
      {legalContent[locale].privacy.map((section) => (
        <ProseSection key={section.title} title={section.title}>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </ProseSection>
      ))}
    </ContentPage>
  );
}
