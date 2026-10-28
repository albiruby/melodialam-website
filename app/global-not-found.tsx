import { Instrument_Serif, Inter, JetBrains_Mono, Red_Hat_Display } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getSiteSettings } from "@/lib/site-settings";
import NotFound from "./(site)/not-found";

/**
 * The 404 for a URL that matches no route at all.
 *
 * Next's `global-not-found` is a full document of its own — the root layout is
 * not applied — so the fonts, header and footer are rendered here.
 * `app/not-found.tsx` still handles `notFound()` thrown inside a matched route.
 */

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const redHatDisplay = Red_Hat_Display({
  subsets: ["latin"],
  variable: "--font-red-hat",
  display: "swap",
});
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
  title: "Halaman tidak ditemukan — Melodi Alam",
  description: "Halaman yang kamu cari sudah pindah atau tidak pernah ada di arsip Melodi Alam.",
  robots: { index: false, follow: false },
};

export default async function GlobalNotFound() {
  const settings = await getSiteSettings();

  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${redHatDisplay.variable} ${instrument.variable} ${jetbrains.variable}`}
    >
      <body className="antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:border-2 focus:border-ink focus:bg-white focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:font-bold focus:uppercase focus:tracking-wider focus:text-ink"
        >
          Lompat ke konten utama
        </a>
        <SiteHeader />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto max-w-[1360px] space-y-20 px-4 py-10 sm:px-8"
        >
          <NotFound />
        </main>
        <SiteFooter settings={settings} />
      </body>
    </html>
  );
}
