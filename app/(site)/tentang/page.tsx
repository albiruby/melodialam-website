import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { EXTERNAL_LINKS, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tentang",
  description:
    "Melodi Alam adalah rumah bagi jurnalisme musik, sesi intim panggung, ruang dengar, dan perangkat audio analog di Indonesia. Bagian dari ekosistem PT Infia Pariwara Nusantara.",
  alternates: { canonical: "/tentang" },
};

const PILLARS = [
  {
    title: "Stories",
    note: "Jurnalisme musik",
    body: "Esai skena, liputan panggung, catatan wawancara, dan rekomendasi yang ditulis redaksi — sumbernya post feed @melodi.alam.",
    href: "/stories",
    cta: "Baca Stories",
  },
  {
    title: "Watch",
    note: "Sesi panggung",
    body: "Melodi Samsara di Bogor dan Melodi Taman di luar ruang, plus obrolan panjang Bicara Melodi bersama musisi Indonesia.",
    href: "/videos",
    cta: "Lihat Videos",
  },
  {
    title: "Curated News",
    note: "Pilihan tim",
    body: "Fakta musik, lirik, trivia, kutipan, rekomendasi, ulas melodi, dan clipper — pilihan tim dari feed Instagram kami.",
    href: "/kurasi",
    cta: "Buka Curated News",
  },
];

const CHANNELS = EXTERNAL_LINKS.filter((link) =>
  ["Instagram", "YouTube", "Threads", "TikTok", "Linktree"].includes(link.label),
);

export default function TentangPage() {
  return (
    <Reveal>
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-ink pb-3">
        <h1 className="text-4xl tracking-tight sm:text-5xl">Tentang</h1>
        <span className="font-serif text-sm italic text-neutral-600">({SITE.est} · {SITE.tagline})</span>
      </div>

      <div className="grid grid-cols-1 gap-10 border-b border-ink py-8 md:grid-cols-12">
        <div className="md:col-span-7">
          <p className="font-serif text-2xl italic leading-snug text-neutral-800 sm:text-3xl">
            {SITE.strapline}.
          </p>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-neutral-700 sm:text-base">
            {SITE.description}
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-700 sm:text-base">
            Kami menulis tentang musik Indonesia dari dekat: panggung yang baru saja selesai,
            lagu yang baru dirilis, dan orang-orang yang mengerjakannya di belakang layar.
            Sebagian besar cerita berawal dari feed Instagram kami, lalu dibawa ke sini
            sebagai catatan yang lebih panjang.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/stories"
              className="border border-ink bg-white px-3 py-1.5 text-xs font-bold uppercase transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink hover:text-white"
            >
              Stories ↗
            </Link>
            <Link
              href="/submit"
              className="border border-ink bg-white px-3 py-1.5 text-xs font-bold uppercase transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink hover:text-white"
            >
              Submit Karya ↗
            </Link>
            <Link
              href="/rss.xml"
              className="border border-ink bg-white px-3 py-1.5 text-xs font-bold uppercase transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink hover:text-white"
            >
              RSS ↗
            </Link>
          </div>
        </div>

        <div className="md:col-span-5">
          <div className="border border-ink bg-paper p-5">
            <div className="font-mono text-[11px] font-bold uppercase tracking-wider">
              Kontak &amp; partnership
            </div>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              Untuk kerja sama, liputan, atau mengirim karya:
            </p>
            <p className="mt-2 text-sm">
              <a
                href="mailto:melodialam.ip@gmail.com"
                className="font-bold underline transition-colors hover:text-forest"
              >
                melodialam.ip@gmail.com
              </a>
              <span className="mx-1 text-neutral-400">/</span>
              <a
                href="mailto:helfan@infia.co"
                className="font-bold underline transition-colors hover:text-forest"
              >
                helfan@infia.co
              </a>
            </p>

            <div className="mt-5 font-mono text-[11px] font-bold uppercase tracking-wider">
              Samsara Listening Space &amp; Resto
            </div>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600">
              Jl. Jalak Harupat No.19, RT.04/RW.04, Babakan, Kecamatan Bogor Tengah,
              Kota Bogor, Jawa Barat 16129.{" "}
              <a
                href="https://www.google.com/maps/search/?api=1&query=Samsara+Listening+Space+%26+Resto+Bogor"
                target="_blank"
                rel="noreferrer"
                className="whitespace-nowrap font-bold underline transition-colors hover:text-forest"
              >
                Peta ↗
              </a>
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {CHANNELS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-ink bg-white px-2.5 py-1 text-[11px] font-bold uppercase transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink hover:text-white"
                >
                  {link.label} ↗
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-ink border-b border-ink sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {PILLARS.map((pillar) => (
          <div key={pillar.title} className="p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-2xl font-bold tracking-tight">{pillar.title}</h2>
              <span className="font-mono text-[10px] uppercase text-neutral-500">{pillar.note}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600">{pillar.body}</p>
            <Link
              href={pillar.href}
              className="mt-4 inline-block text-[11px] font-bold uppercase tracking-wider text-ink underline transition-colors hover:text-forest"
            >
              {pillar.cta} ↗
            </Link>
          </div>
        ))}
      </div>

      <p className="pt-5 font-mono text-[11px] text-neutral-500">
        {SITE.name} — {SITE.owner}. Bagian dari ekosistem Intellectual Property PT Infia
        Pariwara Nusantara (INFIA Corp).
      </p>
    </Reveal>
  );
}
