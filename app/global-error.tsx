"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useSyncExternalStore } from "react";

import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/lib/i18n/config";

/**
 * The last-resort screen: it replaces the whole document when the root layout
 * itself has failed, so neither globals.css nor LocaleProvider is available.
 *
 * That means the colours and the copy both have to be inlined here. The locale
 * is read straight off the cookie rather than through the provider, because
 * there is no provider left to read from.
 */
const COPY: Record<Locale, { title: string; body: string; retry: string }> = {
  ja: {
    title: "エラーが発生しました",
    body: "現在リクエストを完了できません。入力された情報がこのメッセージに表示されることはありません。",
    retry: "もう一度試す",
  },
  en: {
    title: "Something went wrong",
    body: "We can't complete this request right now. Nothing you entered is shown in this message.",
    retry: "Try again",
  },
};

function readLocaleCookie(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : undefined;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // The cookie is browser state, so it is read through a store rather than set
  // from an effect: the server snapshot is the default locale, which keeps the
  // first client render identical. A hydration mismatch on the error screen
  // would be an error inside the error handler.
  const locale = useSyncExternalStore(
    () => () => {},
    readLocaleCookie,
    () => DEFAULT_LOCALE,
  );

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const copy = COPY[locale];

  return (
    <html lang={locale}>
      {/* Colours mirror the design tokens (--night, --on-night, --vermilion,
        * --on-night-muted); they are literals because the stylesheet that
        * defines them is not guaranteed to have loaded. */}
      <body className="flex min-h-screen items-center justify-center bg-[#10130f] px-5 text-[#f4f1e8]">
        <main className="max-w-lg text-center">
          <p className="text-xs font-bold tracking-[0.22em] text-[#e2694a] uppercase">MOOR SPICE</p>
          <h1 className="mt-4 font-serif text-4xl font-normal">{copy.title}</h1>
          <p className="mt-4 text-sm leading-7 text-[#b9c0b3]">{copy.body}</p>
          <button
            className="mt-7 cursor-pointer rounded-full bg-[#a3231d] px-7 py-3 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#7f1a15]"
            onClick={reset}
            type="button"
          >
            {copy.retry}
          </button>
        </main>
      </body>
    </html>
  );
}
