import "server-only";

import { cookies } from "next/headers";

import ja from "./dictionaries/ja.json";
import en from "./dictionaries/en.json";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";

/**
 * Server-side locale, for `generateMetadata`.
 *
 * Page metadata cannot come from the client provider — it is produced before
 * any component renders — so it reads the cookie directly. A crawler sends no
 * cookie and therefore always sees Japanese, which is the intended canonical
 * version for a site that serves both languages from one URL.
 */
const dictionaries = { ja, en } as const;

export async function getServerLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getMeta(): Promise<Record<keyof typeof ja, string>> {
  return dictionaries[await getServerLocale()] as Record<keyof typeof ja, string>;
}
