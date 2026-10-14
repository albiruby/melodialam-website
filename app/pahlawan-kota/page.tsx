import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { VideoModal, WatchButton } from "@/components/VideoModal";
import { GENRE_ROWS } from "@/lib/content";

export const metadata: Metadata = {
  title: "Pahlawan Musik Kota & Skena",
  description:
    "Direktori Pahlawan Musik Kota: peta skena musik Indonesia dari indie folk Bogor, surf rock dan melankolia radikal, hingga pendatang baru AMI.",
};

export default function PahlawanKotaPage() {
  return (
    <Reveal>
      <div className="flex items-baseline justify-between border-b-2 border-ink pb-2">
        <h2 className="text-3xl tracking-tight sm:text-4xl">Pahlawan Musik Kota &amp; Skena</h2>
        <span className="text-xs font-bold uppercase tracking-wider">#RekomendasiMelodi ↗</span>
      </div>

      <div className="divide-y divide-ink border-b border-ink">
        {GENRE_ROWS.map((row) => {
          const target = row.videoId
            ? { href: `https://www.youtube.com/watch?v=${row.videoId}`, label: "WATCH" }
            : row.articleSlug
              ? { href: `/journal/${row.articleSlug}`, label: "READ" }
              : null;

          return (
            <div
              key={row.slug}
              className="group grid cursor-pointer grid-cols-1 items-center gap-6 px-2 py-5 transition-all duration-300 hover:bg-paper md:grid-cols-12"
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

              <div className="flex items-center justify-between gap-4 md:col-span-8">
                <div className="transition-transform duration-300 group-hover:translate-x-1.5">
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

                <div className="video-action-reveal flex shrink-0 items-center gap-3">
                  {row.videoId ? (
                    <WatchButton
                      id={row.videoId}
                      title={row.title}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink bg-ink text-xs text-white"
                    >
                      ▶
                    </WatchButton>
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink bg-ink text-xs text-white">
                      ✎
                    </span>
                  )}
                  <span className="font-mono text-xs text-neutral-400">—</span>
                  <div className="inline-flex items-center gap-2 border border-ink bg-white px-3 py-2 shadow-[3px_3px_0px_#0D0D0D]">
                    <span className="flex h-5 w-5 items-center justify-center bg-forest font-serif text-[11px] font-bold italic text-white">
                      M
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider">
                      {target?.label ?? "READ"} ↗
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-5 text-xs font-mono text-neutral-500">
        <span>
          Ingin masuk direktori? Kirim demo band kamu bersama satu paragraf tentang kota asal.
        </span>
        <Link
          href="/submit"
          className="nav-link-anim font-bold uppercase tracking-wider text-ink transition-colors hover:text-forest"
        >
          Submit Demo ↗
        </Link>
      </div>

      <VideoModal />
    </Reveal>
  );
}