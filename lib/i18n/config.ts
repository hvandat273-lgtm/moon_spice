/**
 * Locale configuration.
 *
 * The storefront serves both languages from the SAME url — there is no `/en`
 * prefix and no `app/[lang]` segment. The trade-off is deliberate and has one
 * consequence worth stating: a language cannot be linked to or bookmarked, and
 * search engines only ever index one version. Japanese is therefore the
 * canonical language for `metadata`, OpenGraph and the sitemap.
 *
 * In exchange, every page keeps its current rendering mode. Reading the locale
 * cookie inside a Server Component would opt `/about`, `/faq`, `/privacy`,
 * `/terms` and `/recipes` out of static rendering; instead the cookie is read
 * once in the root layout and handed to a client provider, so the pages
 * themselves stay static and the switch costs no navigation.
 */

export const LOCALES = ["ja", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ja";

export const LOCALE_COOKIE = "moor-locale";

/** One year: the choice is a preference, not a session. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "ja" || value === "en";
}

/** Label for each locale, written in that locale — never translated. */
export const LOCALE_LABELS: Record<Locale, string> = {
  ja: "日本語",
  en: "English",
};

/** Compact label for the switch itself, where space is tight. */
export const LOCALE_SHORT_LABELS: Record<Locale, string> = {
  ja: "JA",
  en: "EN",
};
