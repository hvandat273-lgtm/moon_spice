import type { Metadata } from "next";

import { getMeta } from "@/lib/i18n/server";

import { FaqView } from "./FaqView";

export async function generateMetadata(): Promise<Metadata> {
  const m = await getMeta();
  return {
    title: m["meta.faqTitle"],
    description: m["meta.faqDescription"],
    alternates: { canonical: "/faq" },
  };
}

export default function FaqPage() {
  return <FaqView />;
}
