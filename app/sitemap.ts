import type { MetadataRoute } from "next";

import { getPublicSiteUrl, isSiteIndexingEnabled } from "@/lib/server/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isSiteIndexingEnabled()) return [];
  const base = getPublicSiteUrl().origin;
  const generatedAt = new Date();
  const staticRoutes = ["", "/about", "/contact", "/faq", "/recipes", "/terms", "/privacy"];
  return [
    ...staticRoutes.map((pathname, index) => ({
      url: `${base}${pathname}`,
      lastModified: generatedAt,
      changeFrequency: (pathname === "" || pathname === "/recipes" ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: index === 0 ? 1 : pathname === "/recipes" ? 0.8 : 0.6,
    })),
  ];
}
