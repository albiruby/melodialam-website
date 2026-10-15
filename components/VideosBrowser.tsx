"use client";

import { useMemo, useState } from "react";
import { VENUES } from "@/lib/catalogue";
import type { SiteVideo } from "@/lib/videos";
import { YoutubeThumb } from "./YoutubeThumb";
import { WatchButton } from "@/components/VideoModal";
import { WatchLink } from "@/components/WatchLink";

const PAGE_SIZE = 12;
type Filter = (typeof VENUES)[number] | "all";

/**
 * Videos arrive as a prop rather than being imported: they now come from Sanity
 * (with `lib/catalogue.json` as the back catalogue) on the server, and this is a
 * client component.
 */
export function VideosBrowser({ videos }: { videos: SiteVideo[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");

  const all = useMemo(
    () => (filter === "all" ? videos : videos.filter((v) => v.venue === filter)),
    [videos, filter],
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.featuring.some((f) => f.toLowerCase().includes(q)),
    );
  }, [all, query]);

  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const rows = matches.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  // Counted from the videos actually handed in, so a CMS video is included in its
  // program's total rather than only in the catalogue's frozen numbers.
  const tabs: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: "All", count: videos.length },
    ...VENUES.map((v) => ({
      value: v,
      label: v,
      count: videos.filter((video) => video.venue === v).length,
    })),
  ];

  const reset = (fn: () => void) => {
    fn();
    setPage(0);
  };

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b-2 border-ink pb-3">
        <div className="flex items-baseline gap-4">
          <h2 className="font-display text-5xl font-black uppercase leading-none tracking-tight sm:text-7xl">
            Videos
          </h2>
          <span className="font-serif text-base italic text-neutral-600 sm:text-lg">
            (melodi samsara &amp; melodi taman)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => reset(() => setFilter(tab.value))}
              aria-pressed={filter === tab.value}
              className={`border border-ink px-3 py-1.5 transition-all duration-300 ${
                filter === tab.value
                  ? "bg-ink text-white"
                  : "hover:bg-paper"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-4 border-b border-ink py-3">
        <label htmlFor="videos-search" className="sr-only">
          Cari video
        </label>
        <input
          id="videos-search"
          type="search"
          value={query}
          onChange={(e) => reset(() => setQuery(e.target.value))}
          placeholder="Cari judul atau artis..."
          className="w-full max-w-sm border-b border-ink bg-transparent py-1 text-xs outline-none transition-colors placeholder:text-neutral-500 focus:border-forest"
        />
        <span className="font-mono text-[11px] text-neutral-500">
          {matches.length} video • halaman {safePage + 1} / {pageCount}
        </span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-neutral-300 border-b border-ink">
        {rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-neutral-500">
            Tidak ada video yang cocok.
          </p>
        ) : (
          rows.map((video, i) => (
            <VideoRow key={video.id} video={video} index={safePage * PAGE_SIZE + i} />
          ))
        )}
      </div>

      {/* Prev / channel / next */}
      <div className="grid grid-cols-3 items-center pt-5 font-mono text-xs">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={safePage === 0}
          className="group text-left disabled:opacity-40"
        >
          <span className="block text-xl font-black uppercase tracking-tight text-neutral-400 transition-all duration-300 group-hover:-translate-x-1.5 group-hover:text-ink sm:text-2xl">
            ← PREV
          </span>
          <span className="text-[10px] text-neutral-500">Previous Sessions</span>
        </button>

        <div className="text-center">
          <a
            href="https://www.youtube.com/@melodialam/videos"
            target="_blank"
            rel="noreferrer"
            className="group inline-block"
          >
            <span className="block text-xl font-black uppercase tracking-tight text-neutral-400 transition-colors duration-300 group-hover:text-ink sm:text-2xl">
              CHANNEL ↗
            </span>
            <span className="text-[10px] text-neutral-500">youtube.com/@melodialam</span>
          </a>
        </div>

        <button
          type="button"
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          disabled={safePage >= pageCount - 1}
          className="group text-right disabled:opacity-40"
        >
          <span className="block text-xl font-black uppercase tracking-tight text-ink transition-all duration-300 group-hover:translate-x-1.5 group-hover:text-forest sm:text-2xl">
            NEXT →
          </span>
          <span className="text-[10px] text-neutral-500">More Live Sessions</span>
        </button>
      </div>
    </>
  );
}

function VideoRow({ video, index }: { video: SiteVideo; index: number }) {
  const no = String(index + 1).padStart(2, "0");

  return (
    <div
      style={{ animationDelay: `${(index % PAGE_SIZE) * 70}ms` }}
      className="stagger-item group flex cursor-pointer flex-wrap items-center justify-between gap-5 px-3 py-5 transition-all duration-300 hover:bg-paper md:flex-nowrap"
    >
      <div className="flex shrink-0 items-center gap-4 sm:gap-6">
        <span className="text-outline-muted w-10 font-mono text-3xl font-bold sm:text-4xl">
          {no}
        </span>
        <WatchButton
          id={video.id}
          title={video.title}
          className="h-24 w-44 shrink-0 overflow-hidden border border-ink bg-neutral-900 sm:h-28 sm:w-56"
        >
          <YoutubeThumb id={video.id} className="editorial-img h-full w-full object-cover" />
        </WatchButton>
      </div>

      <div className="min-w-[240px] flex-1 transition-transform duration-300 group-hover:translate-x-1.5">
        <div className="font-mono text-[10px] uppercase text-neutral-500">
          {video.venue} • {video.views} views • {video.uploaded}
        </div>
        <h3 className="mt-0.5 text-sm font-extrabold uppercase leading-snug tracking-tight transition-colors group-hover:text-forest sm:text-base">
          <WatchLink id={video.id} title={video.title}>
            {video.title}
          </WatchLink>
        </h3>
        <p className="mt-1 line-clamp-2 max-w-xl text-xs leading-relaxed text-neutral-600">
          {video.duration} durasi
          {video.featuring.length > 0 ? ` • Featuring ${video.featuring.join(", ")}` : ""}
        </p>
      </div>

      <div className="video-action-reveal flex shrink-0 items-center gap-3 sm:gap-4">
        <WatchButton
          id={video.id}
          title={video.title}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink bg-ink text-white transition-colors hover:bg-forest"
        >
          ▶
        </WatchButton>
        <span className="select-none font-mono text-sm font-bold text-neutral-400">—</span>
        <div className="inline-flex items-center gap-2.5 border border-ink bg-white px-3.5 py-2 shadow-[4px_4px_0px_#0D0D0D] transition-colors group-hover:border-forest">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-forest font-serif text-xs font-bold italic text-white">
            M
          </span>
          <div className="text-left leading-none">
            <span className="block font-mono text-[9px] uppercase text-neutral-500">
              Melodi Alam
            </span>
            <span className="block text-sm font-black uppercase tracking-wider text-ink">
              Watch ↗
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}