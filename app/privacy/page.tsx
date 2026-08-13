import type { Metadata } from "next";

import { getMeta } from "@/lib/i18n/server";

import { PrivacyView } from "./PrivacyView";

export async function generateMetadata(): Promise<Metadata> {
  const m = await getMeta();
  return {
    title: m["legal.privacyTitle"],
    description: m["meta.privacyDescription"],
    alternates: { canonical: "/privacy" },
  };
}
export default function Page() {
  return <PrivacyView />;
}
