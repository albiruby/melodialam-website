import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { VideoModal, WatchButton } from "@/components/VideoModal";
import { allInterviews } from "@/lib/interviews";
import { allVideos, videoById } from "@/lib/videos";

export const metadata: Metadata = {
  title: "Bicara Melodi",
  description:
    "Index wawancara dan sesi Bicara Melodi Season 3 bersama musisi Indonesia tentang musikalitas, industri, dan proses kreatif.",
};

export default async function BicaraMelodiPage() {
  // The curated index comes from Sanity, and each row's stats from the video it
  // points at — so nothing on this page is hand-written twice.
  const [interviews, videos] = await Promise.all([allInterviews(), allVideos()]);
  const rows = interviews.map((row) => ({ row, video: videoById(videos, row.videoId) }));

  return (
    <Reveal className="editorial-paper border border-ink p-5 sm:p-10">
      {/* Index header */}
      <div className="grid grid-cols-3 items-center border-b border-ink pb-4 text-[11px] font-bold uppercase tracking-wider">
        <div>
          Interview &amp; Session
          <br />
          <span className="font-normal text-neutral-500">Index</span>
        </div>
        <div className="text-center font-serif text-base font-normal italic lowercase text-ink">
          (index)
        </div>
        <div className="text-right">
          <a
            href="https://www.youtube.com/@melodialam/videos"
            target="_blank"
            rel="noreferrer"
            className="nav-link-anim hover:text-forest"
          >
            Bicara Melodi S3 ↗
          </a>
        </div>
      </div>

      {/* Typographic rows */}
      <div className="divide-y divide-ink border-b border-ink">
        {rows.map(({ row, video }) => (
          <article
            key={row.slug}
            className="group -mx-3 flex cursor-pointer flex-col items-start justify-between gap-6 px-3 py-7 transition-all duration-500 hover:bg-white md:flex-row md:items-center"
          >
            <div className="max-w-3xl transition-transform duration-500 group-hover:translate-x-3">
              <h2 className="mb-1 font-display text-4xl leading-none tracking-tight text-ink sm:text-6xl">
                {row.artist}
              </h2>
              <p className="text-2xl font-extrabold uppercase leading-[0.94] tracking-tight text-ink transition-colors duration-300 group-hover:text-forest sm:text-5xl">
                {row.headline}
              </p>
              {video ? (
                <p className="mt-2 font-mono text-[10px] uppercase text-neutral-500">
                  {video.duration} • {video.uploaded}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-col items-end self-end md:self-center">
              <WatchButton
                id={row.videoId}
                title={`${row.artist} — ${row.headline}`}
                className="h-28 w-40 overflow-hidden border border-ink bg-neutral-300 transition-all duration-500 group-hover:shadow-[5px_5px_0px_#0D0D0D] md:h-28 md:w-40"
              >
                <Image
                  src={row.image}
                  alt={row.artist}
                  fill
                  sizes="160px"
                  className="editorial-img object-cover"
                />
              </WatchButton>
              <span className="mt-1.5 font-serif text-sm italic text-neutral-600 transition-colors group-hover:text-forest">
                ({row.caption} ↗)
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-4 pt-5 text-xs font-mono text-neutral-500">
        <Link
          href="/videos"
          className="nav-link-anim font-bold uppercase tracking-wider text-ink transition-colors hover:text-forest"
        >
          Lihat semua video ↗
        </Link>
      </div>

      <VideoModal />
    </Reveal>
  );
}