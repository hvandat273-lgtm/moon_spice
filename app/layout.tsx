import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import { SkipLink } from "@/components/shop/SkipLink";
import { StorefrontFooter, StorefrontHeader } from "@/components/shop/StorefrontShell";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { getMeta } from "@/lib/i18n/server";
import { isSiteIndexingEnabled } from "@/lib/server/env";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const notoSans = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

const notoSerif = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
  display: "swap"
});

// Public shell/settings are refreshed even if an invalidation webhook is temporarily unavailable.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const m = await getMeta();
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: m["meta.siteTitle"],
      template: "%s | MOOR SPICE"
    },
    description: m["meta.siteDescription"],
    applicationName: "MOOR SPICE",
    openGraph: {
      type: "website",
      // The OG card is a single pre-rendered image with Japanese type baked
      // into it, so the locale here stays ja regardless of the reader's
      // preference — a mismatched locale tag would be worse than a fixed one.
      locale: "ja_JP",
      siteName: "MOOR SPICE",
      title: m["meta.siteTitle"],
      description: m["meta.ogDescription"],
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "MOOR SPICE" }]
    },
    robots: isSiteIndexingEnabled() ? { index: true, follow: true } : { index: false, follow: false }
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#101e14",
  colorScheme: "dark"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // The one place the locale cookie is read on the server. Doing it here keeps
  // it out of the individual pages, which would drop them from static
  // rendering; the layout is already dynamic because the header reads settings.
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return (
    <html lang={locale} data-locale={locale} data-scroll-behavior="smooth" className={`${notoSans.variable} ${notoSerif.variable}`}>
      <body>
        <LocaleProvider initialLocale={locale}>
          <SkipLink />
          <StorefrontHeader />
          <main id="main-content">{children}</main>
          <StorefrontFooter />
        </LocaleProvider>
      </body>
    </html>
  );
}
