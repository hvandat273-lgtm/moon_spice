import type { MetadataRoute } from "next";

import { getPublicSiteUrl, isSiteIndexingEnabled } from "@/lib/server/env";

export default function robots(): MetadataRoute.Robots {
  if (!isSiteIndexingEnabled()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  const base = getPublicSiteUrl().origin;
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
