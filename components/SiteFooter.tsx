import Link from "next/link";
import { FOOTER_RUBRIKS } from "@/lib/site";
import type { SiteSettings } from "@/lib/site-settings";
import { InstagramIcon, TiktokIcon, YoutubeIcon } from "./BrandIcons";
import { MelodiAlamLockup } from "./MelodiAlamLockup";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="mt-20 border-t-2 border-ink bg-paper">
      <div className="mx-auto grid max-w-[1360px] grid-cols-1 gap-8 border-b border-ink px-4 py-12 md:grid-cols-12 sm:px-8">
        <div className="space-y-3 md:col-span-5">
          {/* The footer is where the lockup gets room to read properly. */}
          <MelodiAlamLockup
            width={420}
            sizes="(min-width: 640px) 420px, 360px"
            className="h-auto w-[360px] sm:w-[420px]"
          />
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
          {/* Copy below names the venue; this lockup names the ecosystem owner. */}
          <MelodiAlamLockup width={280} sizes="280px" className="h-auto w-[280px]" />
          <p className="text-neutral-700">
            <strong>Samsara Listening Space &amp; Resto:</strong>
            <br />
            Jl. Jalak Harupat No.19, RT.04/RW.04, Babakan, Kecamatan Bogor Tengah, Kota Bogor,
            Jawa Barat 16129.{" "}
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
              aria-label="Instagram Melodi Alam"
              title="Instagram"
              className="flex items-center justify-center border border-ink bg-white px-3 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink hover:text-white"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
            <a
              href="https://www.youtube.com/@melodialam/videos"
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube Melodi Alam"
              title="YouTube"
              className="flex items-center justify-center border border-ink bg-white px-3 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink hover:text-white"
            >
              <YoutubeIcon className="h-5 w-5" />
            </a>
            <a
              href="https://www.tiktok.com/@melodi.alam"
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok Melodi Alam"
              title="TikTok"
              className="flex items-center justify-center border border-ink bg-white px-3 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink hover:text-white"
            >
              <TiktokIcon className="h-5 w-5" />
            </a>
          </div>

          <p className="pt-4 text-neutral-700">
            <strong>Contact for partnership:</strong>
            <br />
            <a
              href={`mailto:${settings.contactEmail}`}
              className="underline transition-colors hover:text-forest"
            >
              {settings.contactEmail}
            </a>
            {" / "}
            <a href={`mailto:${settings.partnerEmail}`} className="underline transition-colors hover:text-forest">
              {settings.partnerEmail}
            </a>
          </p>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between px-4 py-4 text-[11px] font-mono text-neutral-500 sm:px-8">
        <span>© 2017–2026 {settings.name} • INFIA PARIWARA NUSANTARA</span>
        <span>DESIGN SYSTEM: SWISS EDITORIAL BRUTALISM</span>
      </div>
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3 px-4 py-4 font-mono text-[10px] uppercase tracking-wider text-neutral-500 sm:px-8">
          <span>© 2026 Melodi Alam</span>
          <div className="flex gap-4">
            <Link href="/privasi" className="transition-colors hover:text-forest">
              Kebijakan Privasi
            </Link>
            <Link href="/ketentuan" className="transition-colors hover:text-forest">
              Ketentuan
            </Link>
          </div>
        </div>

    </footer>
  );
}