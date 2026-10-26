import { Instrument_Serif, Inter, JetBrains_Mono, Red_Hat_Display } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "../globals.css";
import { ScrollProgress } from "@/components/ScrollProgress";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Ticker } from "@/components/Ticker";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { Analytics } from "@vercel/analytics/next";
import { EXTERNAL_LINKS, SITE } from "@/lib/site";
import { jsonLdScript } from "@/lib/json-ld";
import { getSiteSettings } from "@/lib/site-settings";

/**
 * Body and UI text. Loaded as a variable font, so the full weight axis is
 * available and each element picks its own weight.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * Display slot — the largest headings on a page (the VIDEOS masthead and the
 * artist names in the Bicara Melodi index). Also variable.
 */
const redHatDisplay = Red_Hat_Display({
  subsets: ["latin"],
  variable: "--font-red-hat",
  display: "swap",
});

/**
 * Instrument Serif has no variable axis (400 only), so it stays pinned and
 * carries the italic captions and the article drop cap.
 */
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    type: "website",
    locale: SITE.locale,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    // The social card, for the pages that have no photo of their own. A page
    // that does have one (an article cover) overrides this with its own.
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: `${SITE.name} — ${SITE.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: ["/og.png"],
  },
};

/**
 * Site-level structured data: what this site is and who publishes it. Rendered
 * once in the body; a page may add its own graph next to it (an article adds
 * Article + BreadcrumbList).
 */
const siteJsonLd = jsonLdScript({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      description: SITE.description,
      inLanguage: "id-ID",
      publisher: { "@id": `${SITE.url}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#organization`,
      name: SITE.name,
      url: SITE.url,
      logo: { "@type": "ImageObject", url: `${SITE.url}/icon.png` },
      // The venue has its own address block in the footer; these are the
      // channels that speak for the publication itself.
      sameAs: EXTERNAL_LINKS.filter((link) => link.label !== "Samsara Bogor").map(
        (link) => link.href,
      ),
    },
  ],
});

/**
 * The site is light-only, so `colorScheme` is pinned rather than left to the OS.
 * That is what keeps form controls and scrollbars from rendering dark on a
 * machine set to dark mode. `themeColor` matches the paper surface.
 */
export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f6f5f2",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Brand copy lives in the `siteSettings` singleton; the header is a client
  // component, so it takes what it needs as a prop.
  const settings = await getSiteSettings();

  return (
    // Next 16 no longer force-overrides scroll-behavior during navigation.
    // The attribute opts back into an instant scroll-to-top on route change,
    // which matters here because globals.css sets scroll-behavior: smooth.
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${redHatDisplay.variable} ${instrument.variable} ${jetbrains.variable}`}
    >
      <body className="antialiased">
        <MotionRoot>
          {/* The site's own identity, once per page: a WebSite and the
              Organization that publishes it. Article pages add their own
              Article/Breadcrumb graph on top. */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: siteJsonLd }}
          />
          {/* RSS auto-discovery, for readers that look for it. */}
          <link rel="alternate" type="application/rss+xml" title="Melodi Alam" href="/rss.xml" />
          {/* First tab stop on every page, so a keyboard user can skip the
              ticker, masthead and nav instead of walking through all of them. */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:border-2 focus:border-ink focus:bg-white focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:font-bold focus:uppercase focus:tracking-wider focus:text-ink"
          >
            Lompat ke konten utama
          </a>
          <ScrollProgress />
          <Ticker items={settings.tickerItems} />
          <SiteHeader
            brand={{
              tagline: settings.tagline,
              strapline: settings.strapline,
              est: settings.est,
              owner: settings.owner,
            }}
          />
          <main
            id="main"
            tabIndex={-1}
            className="mx-auto max-w-[1360px] space-y-20 px-4 py-10 sm:px-8"
          >
            {children}
          </main>
          <SiteFooter settings={settings} />
        </MotionRoot>
        {/* Cookieless page views, from Vercel. Nothing is shown until Web
            Analytics is switched on for the project in the dashboard. */}
        <Analytics />
      </body>
    </html>
  );
}