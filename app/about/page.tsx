import type { Metadata } from "next";

import { getMeta } from "@/lib/i18n/server";

import { AboutView } from "./AboutView";

export async function generateMetadata(): Promise<Metadata> {
  const m = await getMeta();
  return {
    title: m["meta.aboutTitle"],
    description: m["meta.aboutDescription"],
    alternates: { canonical: "/about" },
  };
}

export default function AboutPage() {
  return <AboutView />;
}
