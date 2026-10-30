import type { SiteVideo } from "@/lib/videos";
import { YoutubeThumb } from "./YoutubeThumb";
import { WatchButton } from "@/components/VideoModal";
import { WatchLink } from "@/components/WatchLink";

/** One session row: number, thumbnail, title, meta, and the hover action group. */
export function VideoRow({ video, index }: { video: SiteVideo; index: number }) {
  const no = String(index + 1).padStart(2, "0");

  return (
    <div
      style={{ animationDelay: `${(index % 12) * 70}ms` }}
      className="stagger-item group flex cursor-pointer flex-wrap items-center justify-between gap-5 px-3 py-5 transition-[color,background-color,border-color,transform,box-shadow,opacity] duration-300 hover:bg-paper md:flex-nowrap"
    >
      <div className="flex shrink-0 items-center gap-4 sm:gap-6">
        <span className="text-outline-muted w-10 font-sans text-3xl font-bold sm:text-4xl">
          {no}
        </span>
        <WatchButton
          id={video.id}
          title={video.title}
          className="h-24 w-44 shrink-0 overflow-hidden border border-ink bg-neutral-900 sm:h-28 sm:w-56"
        >
          <YoutubeThumb
            id={video.id}
            className="editorial-img h-full w-full object-cover"
            sizes="(min-width: 640px) 224px, 176px"
            width={480}
            height={270}
          />
        </WatchButton>
      </div>

      <div className="min-w-[240px] flex-1 transition-transform duration-300 group-hover:translate-x-1.5">
        <div className="font-sans text-[10px] uppercase text-neutral-600">
          {video.venue} • {video.uploaded}
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
        <span className="select-none font-sans text-sm font-bold text-neutral-600">—</span>
        <a
          href={video.url}
          target="_blank"
          rel="noreferrer"
          title={`Tonton ${video.title} di YouTube`}
          className="inline-flex items-center border border-ink bg-white px-3.5 py-2 shadow-[4px_4px_0px_#0D0D0D] transition-colors hover:border-forest"
        >
          <div className="text-left leading-none">
            <span className="block font-sans text-[10px] uppercase text-neutral-600">
              Melodi Alam
            </span>
            <span className="block text-sm font-black uppercase tracking-wider text-ink">
              Watch</span>
          </div>
        </a>
      </div>
    </div>
  );
}
