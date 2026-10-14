import { Instrument_Serif, Inter, JetBrains_Mono, Red_Hat_Display } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import { ScrollProgress } from "@/components/ScrollProgress";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Ticker } from "@/components/Ticker";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { SITE } from "@/lib/site";

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
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
          <ScrollProgress />
          <Ticker />
          <SiteHeader />
          <main className="mx-auto max-w-[1360px] space-y-20 px-4 py-10 sm:px-8">{children}</main>
          <SiteFooter />
        </MotionRoot>
      </body>
    </html>
  );
}