"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, type CSSProperties } from "react";
import { ChevronRight, Menu } from "lucide-react";

import { useT, type TranslationKey } from "@/lib/i18n/LocaleProvider";

import { LocaleSwitch } from "./LocaleSwitch";
import styles from "./shell.module.css";

const navigation = [
  { href: "/", key: "nav.home" },
  { href: "/about", key: "nav.about" },
  { href: "/recipes", key: "nav.recipes" },
  { href: "/faq", key: "nav.faq" },
] as const satisfies ReadonlyArray<{ href: string; key: TranslationKey }>;

/** Values shipped as defaults in lib/server/settings.ts and catalog-store.ts. */
const SEEDED_ANNOUNCEMENTS = new Set([
  "MOOR SPICE 公式カタログ",
  "MOOR SPICE 公式商品カタログ",
  "MOOR SPICE 公式オンラインカタログ",
]);

export function StorefrontHeaderView({ announcement }: { announcement: string | null }) {
  const t = useT();
  const mobileMenuRef = useRef<HTMLDetailsElement>(null);

  const closeMobileMenu = useCallback(() => {
    if (mobileMenuRef.current) mobileMenuRef.current.open = false;
  }, []);

  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const menu = mobileMenuRef.current;
      if (!menu?.open || !(event.target instanceof Node) || menu.contains(event.target)) return;
      closeMobileMenu();
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobileMenu();
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("popstate", closeMobileMenu);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("popstate", closeMobileMenu);
    };
  }, [closeMobileMenu]);

  const handleNavigation = (href: string, event: { preventDefault: () => void }) => {
    closeMobileMenu();
    // A link to the current route still needs a visible result. Avoid a full
    // route refresh, then move to that page's beginning like a normal Home or
    // active-nav click. Reduced-motion users get an instant jump.
    if (window.location.pathname === href) {
      event.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    }
  };

  return (
    <>
      {/* Admin-authored text is shown verbatim in whatever language it was
        * written. The two bootstrap seeds are not authored by anyone, though,
        * so they count as unset and fall through to the translated string —
        * otherwise an English reader gets a Japanese bar nobody chose. */}
      <div className={styles.announcement}>
        {announcement && !SEEDED_ANNOUNCEMENTS.has(announcement) ? announcement : t("shell.announcement")}
      </div>
      <header className={styles.siteHeader} data-header-condense>
        {/* Reading progress for the scroll-told story below. */}
        <span aria-hidden="true" className={styles.headerProgress} data-scroll-progress />
        <div className={styles.headerInner}>
          <details className={styles.mobileMenu} ref={mobileMenuRef}>
            <summary aria-label={t("nav.menuOpen")}>
              <Menu aria-hidden="true" size={24} strokeWidth={1.5} />
            </summary>
            <div className={styles.mobileMenuPanel}>
              <div className={styles.mobileLocale}>
                <LocaleSwitch />
              </div>
              <nav aria-label={t("nav.mobile")}>
                {navigation.map((item, index) => (
                  <Link
                    href={item.href}
                    key={item.href}
                    onNavigate={(event) => handleNavigation(item.href, event)}
                    style={{ "--i": index } as CSSProperties}
                  >
                    {t(item.key)}
                    <ChevronRight aria-hidden="true" size={16} />
                  </Link>
                ))}
              </nav>
            </div>
          </details>

          <Link
            aria-label={t("nav.homeAria")}
            className={styles.logoLink}
            href="/"
            onNavigate={(event) => handleNavigation("/", event)}
          >
            <Image alt="MOOR SPICE" height={60} loading="eager" src="/brand/logo.svg" width={272} />
          </Link>

          <nav aria-label={t("nav.main")} className={styles.desktopNav}>
            {navigation.map((item) => (
              <Link href={item.href} key={item.href} onNavigate={(event) => handleNavigation(item.href, event)}>
                {t(item.key)}
              </Link>
            ))}
          </nav>

          <div className={styles.headerLocale}>
            <LocaleSwitch />
          </div>
        </div>
      </header>
    </>
  );
}
