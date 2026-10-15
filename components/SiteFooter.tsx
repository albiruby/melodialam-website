import Link from "next/link";
import { FOOTER_RUBRIKS } from "@/lib/site";
import type { SiteSettings } from "@/lib/site-settings";
import { BrandMark, SamsaraWordmark } from "./BrandMark";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="mt-20 border-t-2 border-ink bg-paper">
      <div className="mx-auto grid max-w-[1360px] grid-cols-1 gap-8 border-b border-ink px-4 py-12 md:grid-cols-12 sm:px-8">
        <div className="space-y-3 md:col-span-5">
          {/* The footer is where the medallion gets room to read properly. */}
          <div className="flex items-center gap-3.5">
            <BrandMark
              size={128}
              sizes="(min-width: 640px) 96px, 80px"
              className="h-20 w-20 shrink-0 sm:h-24 sm:w-24"
            />
            <h2 className="text-3xl font-black uppercase tracking-tighter">{settings.name}</h2>
          </div>
          <p className="font-serif text-lg italic text-neutral-700">
            A living ecosystem of melody: Stories and Watch.
          </p>
          <p className="max-w-sm text-xs leading-relaxed text-neutral-600">
            Bagian dari ekosistem Intellectual Property (IP) PT Infia Pariwara Nusantara
            (INFIA Corp). Menghubungkan jurnalisme musik, sesi intim panggung, ruang dengar
            Samsara Bogor, hingga perangkat audio analog SVVARA.
          </p>
        </div>

        <div className="space-y-2 text-xs md:col-span-3">
          <div className="mb-3 font-mono font-bold uppercase tracking-wider">Rubrik & Program</div>
          <ul className="space-y-1.5 text-neutral-700">
            {FOOTER_RUBRIKS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="inline-block transition-transform hover:translate-x-1"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2 text-xs md:col-span-4">
          <div className="mb-3 font-mono font-bold uppercase tracking-wider">
            Ekosistem Ruang & Kanal Resmi
          </div>
          {/* Copy below names the venue, so the mark itself is decorative. */}
          <SamsaraWordmark width={200} tone="forest" alt="" className="h-auto w-[200px]" />
          <p className="text-neutral-700">
            <strong>Samsara Listening Space &amp; Resto:</strong>
            <br />
            Kawasan Sekitar Kebun Raya Bogor, Kota Bogor, Jawa Barat.{" "}
            <a
              href="https://www.google.com/maps/search/?api=1&query=Samsara+Listening+Space+%26+Resto+Bogor"
              target="_blank"
              rel="noreferrer"
              className="whitespace-nowrap font-bold underline transition-colors hover:text-forest"
            >
              Lihat di Google Maps ↗
            </a>
          </p>
          <div className="flex flex-wrap gap-2 pt-3">
            <a
              href="https://www.instagram.com/melodi.alam/?hl=en"
              target="_blank"
              rel="noreferrer"
              className="border border-ink bg-white px-3 py-1.5 font-bold uppercase transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink hover:text-white"
            >
              Instagram ↗
            </a>
            <a
              href="https://www.youtube.com/@melodialam/videos"
              target="_blank"
              rel="noreferrer"
              className="border border-ink bg-white px-3 py-1.5 font-bold uppercase transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink hover:text-white"
            >
              YouTube ↗
            </a>
            <a
              href="https://www.tiktok.com/@melodi.alam"
              target="_blank"
              rel="noreferrer"
              className="border border-ink bg-white px-3 py-1.5 font-bold uppercase transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink hover:text-white"
            >
              TikTok ↗
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between px-4 py-4 text-[11px] font-mono text-neutral-500 sm:px-8">
        <span>© 2017–2026 {settings.name} • INFIA PARIWARA NUSANTARA</span>
        <span>DESIGN SYSTEM: SWISS EDITORIAL BRUTALISM</span>
      </div>
    </footer>
  );
}