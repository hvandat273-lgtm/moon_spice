import type { Metadata } from "next";

import { getMeta } from "@/lib/i18n/server";

import {
  ChefChapter,
  FinalCta,
  IngredientsChapter,
  MethodChapter,
  SouvenirChapter,
  UsageChapter,
  YudeChapter,
} from "@/components/shop/Chapters";
import { ChapterRail } from "@/components/shop/ChapterRail";
import { HeroProduct } from "@/components/shop/HomeSections";
import { EmptyCatalogNotice } from "@/components/shop/EmptyCatalogNotice";
import { getHomepageCatalog } from "@/lib/server/catalog";
import { getPublicSiteUrl } from "@/lib/server/env";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const m = await getMeta();
  return {
    title: m["meta.homeTitle"],
    description: m["meta.homeDescription"],
    alternates: { canonical: "/" },
  };
}

export default async function HomePage() {
  const { heroProduct, featuredProduct } = await getHomepageCatalog();
  const siteUrl = getPublicSiteUrl();
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "MOOR SPICE",
    url: siteUrl.toString(),
    logo: new URL("/brand/logo.svg", siteUrl).toString()
  };

  const hasCatalogContent = Boolean(heroProduct || featuredProduct);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c") }} type="application/ld+json" />
      {heroProduct ? (
        <>
          <HeroProduct product={heroProduct} />
          <ChapterRail />
          {/* Origin -> technique -> chef -> composition -> method -> plate. */}
          <SouvenirChapter />
          <YudeChapter />
          <ChefChapter />
          <IngredientsChapter />
          <MethodChapter />
          <UsageChapter product={heroProduct} />
          <FinalCta product={featuredProduct ?? heroProduct} />
        </>
      ) : null}
      {!hasCatalogContent ? <EmptyCatalogNotice /> : null}
    </>
  );
}
