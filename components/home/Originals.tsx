import Link from "next/link";
import type { SiteInterview } from "@/lib/interviews";
import type { SiteVideo } from "@/lib/videos";
import { WatchButton } from "@/components/VideoModal";
import { WatchLink } from "@/components/WatchLink";
import { YoutubeThumb } from "@/components/YoutubeThumb";
import { SectionBar } from "./SectionBar";

/**
 * The two original programmes, in one dark room.
 *
 * Samsara stays visual: one 16:9 session and two quiet setlist rows. Bicara is
 * a text-only list — artist, headline, no thumbnails, no episode numbers. The
 * contrast between the two is the point; merging them into one section keeps
 * the page from asking the reader to enter the programme twice.
 */
export function Originals({
  featured,
  setlist,
  interviews,
}: {
  featured: SiteVideo | null;
  setlist: SiteVideo[];
  interviews: SiteInterview[];
}) {
  if (!featured && interviews.length === 0) return null;

  return (
    <section
      aria-labelledby="originals-title"
      className="-mx-4 bg-ink px-4 py-10 text-white sm:-mx-8 sm:px-8 sm:py-14"
    >
      <SectionBar
        id="originals-title"
        tone="dark"
        label="Originals"
        href="/videos"
        linkLabel="Tonton semua"
      />

      <div className={`mt-8 grid gap-10 ${featured ? "lg:grid-cols-12 lg:gap-10" : ""}`}>
        {featured ? (
          <div className="min-w-0 lg:col-span-8">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
              Melodi Samsara
            </h3>

            <WatchButton
              id={featured.id}
              title={featured.title}
              label={`Putar sesi: ${featured.title}`}
              className="group mt-3 block w-full text-left focus-visible:outline-white"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-neutral-800">
                <YoutubeThumb
                  id={featured.id}
                  className="editorial-img h-full w-full object-cover opacity-95"
                  sizes="(min-width: 1024px) 800px, 100vw"
                  eager
                />
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-ink/70 pl-1 text-xl text-white transition-colors duration-300 group-hover:bg-forest">
                    ▶
                  </span>
                </span>
              </div>
            </WatchButton>

            <h4 className="mt-4 font-display text-2xl font-black leading-[1.05] tracking-tight sm:text-3xl">
              <WatchLink
                id={featured.id}
                title={featured.title}
                className="transition-colors hover:text-white/70 focus-visible:outline-white"
              >
                {featured.title}
              </WatchLink>
            </h4>

            <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-white/60">
              {featured.venue} · {featured.duration}
            </p>

            {setlist.length > 0 ? (
              <ol className="mt-6 divide-y divide-white/10 border-t border-white/10">
                {setlist.map((video) => (
                  <li key={video.id}>
                    <WatchLink
                      id={video.id}
                      title={video.title}
                      className="group flex items-center justify-between gap-4 py-3 focus-visible:outline-white"
                    >
                      <span className="truncate text-xs font-medium text-white/80 transition-colors group-hover:text-white">
                        {video.title}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] uppercase text-white/50">
                        {video.duration}
                      </span>
                    </WatchLink>
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        ) : null}

        {interviews.length > 0 ? (
          <div
            className={
              featured
                ? "flex min-w-0 flex-col border-t border-white/10 pt-6 lg:col-span-4 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"
                : "flex min-w-0 flex-col"
            }
          >
            <div className="flex items-baseline justify-between gap-4 border-b border-white/20 pb-2">
              <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                Bicara Melodi
              </h3>
              <Link
                href="/bicara-melodi"
                className="inline-flex min-h-11 items-center font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white/70 underline decoration-1 underline-offset-4 transition-colors hover:text-white focus-visible:outline-white"
              >
                Semua episode
              </Link>
            </div>

            <ol className="flex flex-1 flex-col divide-y divide-white/10">
              {interviews.map((row, index) => (
                <li
                  key={row.slug}
                  className={`${index === 3 ? "hidden sm:block" : ""} flex-1`}
                >
                  <WatchLink
                    id={row.videoId}
                    title={`${row.artist} — ${row.headline}`}
                    className="group flex h-full flex-col justify-center py-4 focus-visible:outline-white"
                  >
                    <h4 className="font-display text-xl font-black leading-tight tracking-tight text-white transition-colors group-hover:text-white/70">
                      {row.artist}
                    </h4>
                    <p className="mt-1 text-sm leading-snug text-white/70 transition-colors group-hover:text-white">
                      {row.headline}
                    </p>
                  </WatchLink>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </section>
  );
}
