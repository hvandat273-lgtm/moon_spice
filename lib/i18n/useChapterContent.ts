"use client";

import { chapterContent, type ChapterContent } from "@/components/shop/deck-content";

import { useLocale } from "./LocaleProvider";

/** The six chapters' copy in the active language. */
export function useChapterContent(): ChapterContent {
  return chapterContent[useLocale().locale];
}
