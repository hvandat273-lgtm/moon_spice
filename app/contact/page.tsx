import type { Metadata } from "next";

import { getMeta } from "@/lib/i18n/server";

import { getSiteSetting } from "@/lib/server/settings";

import { ContactView } from "./ContactView";

export async function generateMetadata(): Promise<Metadata> {
  const m = await getMeta();
  return {
    title: m["meta.contactTitle"],
    description: m["meta.contactDescription"],
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage() {
  const contact = await getSiteSetting("store_contact");
  return <ContactView contact={contact} />;
}
