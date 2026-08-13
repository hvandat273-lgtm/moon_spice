"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { useT } from "@/lib/i18n/LocaleProvider";

import { SocialLinks } from "./SocialLinks";
import styles from "./shell.module.css";

/** Shape of the `store_contact` setting. Declared structurally rather than
 * imported, because its type is inferred inside a `server-only` module. */
export interface StoreContactView {
  email?: string;
  phone?: string;
  address?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  amazonUrl?: string;
}

export function StorefrontFooterView({ contact }: { contact: StoreContactView }) {
  const t = useT();
  const hasDirectContact = Boolean(contact.email || contact.phone || contact.address);

  return (
    <footer className={styles.footer}>
      {/* Oversized ghost wordmark, purely a texture behind the columns. */}
      <span aria-hidden="true" className={styles.footerWordmark}>MOOR SPICE</span>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <Image alt="MOOR SPICE" height={56} loading="eager" src="/brand/logo.svg" width={254} />
          <p>{t("shell.footerBlurb")}</p>
          {contact.email ? <a href={`mailto:${contact.email}`}><Mail aria-hidden="true" size={17} /> {contact.email}</a> : null}
          {contact.phone ? <a href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}><Phone aria-hidden="true" size={17} /> {contact.phone}</a> : null}
          {contact.address ? <span><MapPin aria-hidden="true" size={17} /> {contact.address}</span> : null}
          {!hasDirectContact ? <Link href="/contact">{t("shell.footerContact")}</Link> : null}
          <SocialLinks amazonUrl={contact.amazonUrl} facebookUrl={contact.facebookUrl} instagramUrl={contact.instagramUrl} />
        </div>

        <div>
          <h2>MOOR SPICE</h2>
          <Link href="/">{t("nav.home")}</Link>
          <Link href="/#ingredients">{t("shell.footerIngredients")}</Link>
          <Link href="/about">{t("nav.about")}</Link>
        </div>

        <div>
          <h2>{t("nav.recipes")}</h2>
          <Link href="/recipes">{t("shell.footerAglio")}</Link>
          <Link href="/faq">{t("nav.faq")}</Link>
          <Link href="/contact">{t("nav.contact")}</Link>
        </div>

        <div>
          <h2>{t("shell.footerGuide")}</h2>
          <Link href="/privacy">{t("shell.footerPrivacy")}</Link>
          <Link href="/terms">{t("shell.footerTerms")}</Link>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <span>© {new Date().getFullYear()} MOOR SPICE.</span>
        <span>{t("shell.footerRights")}</span>
      </div>
    </footer>
  );
}
