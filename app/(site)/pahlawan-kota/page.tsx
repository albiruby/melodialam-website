import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { allPahlawanRows } from "@/lib/pahlawan";

export const metadata: Metadata = {
  title: "Pahlawan Musik Kota & Skena",
  description:
    "Direktori Pahlawan Musik Kota: peta skena musik Indonesia dari indie folk Bogor, surf rock dan melankolia radikal, hingga pendatang baru AMI.",
  alternates: { canonical: "/pahlawan-kota" },
};

export default async function PahlawanKotaPage() {
  const rows = await allPahlawanRows();

  return (
    <Reveal>
      <div className="flex items-baseline justify-between border-b-2 border-ink pb-2">
        <h2 className="text-3xl tracking-tight sm:text-4xl">Pahlawan Musik Kota &amp; Skena</h2>
        <span className="text-xs font-bold uppercase tracking-wider">#FaktaMusik ↗</span>
      </div>

      <div className="divide-y divide-ink border-b border-ink">
        {rows.map((row) => (
          <div
            key={row.slug}
            className="group grid grid-cols-1 items-center gap-6 px-2 py-5 transition-all duration-300 hover:bg-paper md:grid-cols-12"
          >
            <div className="hover-reveal-box corner-frame aspect-[16/7] border border-ink bg-neutral-900 md:col-span-4">
              <Image
                src={row.image}
                alt={row.title}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="editorial-img object-cover"
              />
            </div>

            <div className="transition-transform duration-300 group-hover:translate-x-1.5 md:col-span-8">
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-2xl font-bold tracking-tight transition-colors group-hover:text-forest">
                  {row.title}
                </h3>
                <span className="font-mono text-[11px] text-neutral-500">{row.artists}</span>
              </div>
              <p className="max-w-2xl text-xs leading-relaxed text-neutral-600 sm:text-sm">
                {row.description}
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {row.tags.map((tag) => (
                  <li
                    key={tag}
                    className="border border-neutral-300 px-1.5 py-0.5 font-mono text-[10px] uppercase text-neutral-500"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-5 text-xs font-mono text-neutral-500">
        <span>
          Ingin masuk direktori? Kirim demo band kamu bersama satu paragraf tentang kota asal.
        </span>
        <Link
          href="/submit"
          className="nav-link-anim font-bold uppercase tracking-wider text-ink transition-colors hover:text-forest"
        >
          Submit Karya ↗
        </Link>
      </div>
    </Reveal>
  );
}
