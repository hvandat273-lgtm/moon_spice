import type { Metadata } from "next";

import { getMeta } from "@/lib/i18n/server";

import { TermsView } from "./TermsView";

export async function generateMetadata(): Promise<Metadata> {
  const m = await getMeta();
  return {
    title: m["legal.termsTitle"],
    description: m["meta.termsDescription"],
    alternates: { canonical: "/terms" },
  };
}
export default function Page() {
  return <TermsView />;
}
