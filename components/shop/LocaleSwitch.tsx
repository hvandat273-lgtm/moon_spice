"use client";

import { LOCALES, LOCALE_LABELS, LOCALE_SHORT_LABELS } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/LocaleProvider";

import styles from "./shell.module.css";

/**
 * Two-button segmented control. Not a <select>: with exactly two options a
 * select hides the alternative behind a tap, and each button can carry its own
 * `lang` so a screen reader pronounces "日本語" in Japanese and "English" in
 * English rather than reading both in the page language.
 *
 * The active state is carried by background *and* weight, not colour alone.
 */
export function LocaleSwitch() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div aria-label={t("locale.label")} className={styles.localeSwitch} role="group">
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <button
            aria-pressed={active}
            className={styles.localeButton}
            data-active={active || undefined}
            key={code}
            lang={code}
            onClick={() => setLocale(code)}
            type="button"
          >
            <span aria-hidden="true">{LOCALE_SHORT_LABELS[code]}</span>
            <span className="sr-only">{LOCALE_LABELS[code]}</span>
          </button>
        );
      })}
    </div>
  );
}
