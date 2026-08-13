"use client";

import { HelpCircle, Mail, MapPin, Phone } from "lucide-react";

import { useT } from "@/lib/i18n/LocaleProvider";
import { PageHero } from "@/components/shop/PageHero";
import { SocialLinks } from "@/components/shop/SocialLinks";
import type { StoreContactView } from "@/components/shop/StorefrontFooterView";
import styles from "@/components/shop/pages.module.css";

export function ContactView({ contact }: { contact: StoreContactView }) {
  const t = useT();
  const hasContact = Boolean(
    contact.email || contact.phone || contact.address || contact.facebookUrl || contact.instagramUrl || contact.amazonUrl,
  );

  return (
    <div className={styles.page}>
      <PageHero
        image="/images/usage-02.webp"
        imageAlt=""
        label={t("contact.eyebrow")}
        lead={t("contact.lead")}
        priority
        title={t("contact.title")}
      />

      <section className={styles.contactGrid}>
        <article data-reveal>
          <Mail aria-hidden="true" size={26} strokeWidth={1.3} />
          <h2>{t("contact.deskTitle")}</h2>
          <p>{t("contact.deskBody")}</p>
          {contact.email ? <a href={`mailto:${contact.email}`}><Mail aria-hidden="true" size={15} /> {contact.email}</a> : null}
          {contact.phone ? <a href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}><Phone aria-hidden="true" size={15} /> {contact.phone}</a> : null}
          {contact.address ? <span><MapPin aria-hidden="true" size={15} /> {contact.address}</span> : null}
          <SocialLinks amazonUrl={contact.amazonUrl} facebookUrl={contact.facebookUrl} instagramUrl={contact.instagramUrl} tone="dark" />
          {!hasContact ? <p>{t("contact.deskEmpty")}</p> : null}
        </article>

        <article data-reveal style={{ "--i": 1 } as React.CSSProperties}>
          <HelpCircle aria-hidden="true" size={26} strokeWidth={1.3} />
          <h2>{t("contact.faqTitle")}</h2>
          <p>{t("contact.faqBody")}</p>
          <a href="/faq">{t("contact.faqCta")}</a>
        </article>
      </section>
    </div>
  );
}
