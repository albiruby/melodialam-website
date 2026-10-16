import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { FeatureCard, HeroArticle } from "@/components/ArticleCards";
import { VideoModal, WatchButton } from "@/components/VideoModal";
import { WatchLink } from "@/components/WatchLink";
import { allArticles } from "@/lib/articles";
import { allInterviews } from "@/lib/interviews";
import { allVideos, latestVideos } from "@/lib/videos";
import { getSiteSettings } from "@/lib/site-settings";
import { CHANNEL } from "@/lib/catalogue";
import { CountUp } from "@/components/motion/CountUp";
import { RevealText } from "@/components/motion/RevealText";
import { YoutubeThumb } from "@/components/YoutubeThumb";

export const metadata: Metadata = {
  /**
   * No `title` override on purpose. A page in the same segment as its layout does
   * not get that layout's `title.template` applied, so setting one here rendered
   * the home page as the bare tagline with no brand name in it. Inheriting the
   * layout default gives "MELODI ALAM — Stories & Watch".
   */
  description:
    "Melodi Alam: jurnalisme musik, catatan wawancara, dan katalog video sesi panggung.",
};

export default async function HomePage() {
  // Sanity when it is configured, the static file otherwise.
  const articles = await allArticles();
  // "Latest News" is simply the four newest; `allArticles()` is newest-first.
  const [hero, ...rest] = articles;
  const subFeatures = rest.slice(0, 3);

  // Sanity first, the build-time catalogue behind it.
  const [videos, interviews, settings] = await Promise.all([
    allVideos(),
    allInterviews(),
    getSiteSettings(),
  ]);

  // A handful of the freshest uploads, for the home-page video teaser.
  const teasers = latestVideos(videos, 4);
  // The home page shows the first three rows of the index, not all of them.
  const interviewRows = interviews.slice(0, 3);

  return (
    <>
      {/* ---------- Latest News ---------- */}
      <Reveal>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-4xl tracking-tight sm:text-5xl">
            <RevealText text="Latest News" />
          </h2>
          <span className="font-serif text-sm italic text-neutral-600">
            ({settings.curationNote})
          </span>
        </div>

        <div className="border-t-2 border-b border-ink">
          <HeroArticle article={hero} />

          <div className="grid grid-cols-1 divide-y divide-ink md:grid-cols-3 md:divide-x md:divide-y-0">
            {subFeatures.map((article) => (
              <div key={article.slug} className="relative">
                <FeatureCard
                  article={article}
                  note={settings.cardCurtain.featureLabel}
                  ctaLabel={settings.cardCurtain.featureCta}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 text-xs font-mono text-neutral-500">
          <span>
            <CountUp to={articles.length} /> artikel di journal • <CountUp to={videos.length} />{" "}
            video
          </span>
          <Link
            href="/journal"
            className="nav-link-anim font-bold uppercase tracking-wider text-ink transition-colors hover:text-forest"
          >
            Semua artikel ↗
          </Link>
        </div>
      </Reveal>

      {/* ---------- Bicara Melodi teaser ---------- */}
      <Reveal className="editorial-paper border border-ink p-5 sm:p-10">
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
            <Link href="/bicara-melodi" className="nav-link-anim hover:text-forest">
              Bicara Melodi S3 ↗
            </Link>
          </div>
        </div>

        <div className="divide-y divide-ink border-b border-ink">
          {interviewRows.map((row) => (
            <article
              key={row.slug}
              className="group -mx-3 flex cursor-pointer flex-col items-start justify-between gap-6 px-3 py-7 transition-all duration-500 hover:bg-white md:flex-row md:items-center"
            >
              <div className="max-w-3xl transition-transform duration-500 group-hover:translate-x-3">
                <h3 className="mb-1 font-display text-4xl leading-none tracking-tight text-ink sm:text-6xl">
                  {row.artist}
                </h3>
                <p className="text-2xl font-extrabold uppercase leading-[0.94] tracking-tight text-ink transition-colors duration-300 group-hover:text-forest sm:text-5xl">
                  {row.headline}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end self-end md:self-center">
                <WatchButton
                  id={row.videoId}
                  title={`${row.artist} — ${row.headline}`}
                  className="h-28 w-40 overflow-hidden border border-ink bg-neutral-300 transition-all duration-500 group-hover:shadow-[5px_5px_0px_#0D0D0D]"
                >
                  <Image
                    src={row.image}
                    alt={row.artist}
                    fill
                    sizes="160px"
                    className="editorial-img object-cover"
                  />
                </WatchButton>
              </div>
            </article>
          ))}
        </div>

        <div className="pt-5 text-right">
          <Link
            href="/bicara-melodi"
            className="nav-link-anim font-mono text-xs font-bold uppercase tracking-wider transition-colors hover:text-forest"
          >
            Buka index lengkap ↗
          </Link>
        </div>
      </Reveal>

      {/* ---------- Videos teaser ---------- */}
      <Reveal>
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b-2 border-ink pb-3">
          <div className="flex items-baseline gap-4">
            <h2 className="font-display text-5xl font-black uppercase leading-none tracking-tight sm:text-7xl">
              <RevealText text="Videos" />
            </h2>
            <span className="font-serif text-base italic text-neutral-600 sm:text-lg">
              (melodi samsara &amp; melodi taman)
            </span>
          </div>
          <span className="font-mono text-[11px] text-neutral-500">
            <CountUp to={videos.length} /> video
          </span>
        </div>

        <div className="divide-y divide-neutral-300 border-b border-ink">
          {teasers.map((video, i) => (
            <div
              key={video.id}
              style={{ animationDelay: `${i * 70}ms` }}
              className="stagger-item group flex flex-wrap items-center justify-between gap-5 px-3 py-5 transition-all duration-300 hover:bg-paper md:flex-nowrap"
            >
              <div className="flex shrink-0 items-center gap-4 sm:gap-6">
                <span className="text-outline-muted w-10 font-mono text-3xl font-bold sm:text-4xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <WatchButton
                  id={video.id}
                  title={video.title}
                  className="h-24 w-44 shrink-0 overflow-hidden border border-ink bg-neutral-900 sm:h-28 sm:w-56"
                >
                  <YoutubeThumb
                    id={video.id}
                    className="editorial-img h-full w-full object-cover"
                  />
                </WatchButton>
              </div>

              <div className="min-w-[240px] flex-1 transition-transform duration-300 group-hover:translate-x-1.5">
                <div className="font-mono text-[10px] uppercase text-neutral-500">
                  {video.venue} • {video.uploaded}
                </div>
                <h3 className="mt-0.5 text-sm font-extrabold uppercase leading-snug tracking-tight transition-colors group-hover:text-forest sm:text-base">
                  <WatchLink id={video.id} title={video.title}>
                    {video.title}
                  </WatchLink>
                </h3>
                <p className="mt-1 line-clamp-1 max-w-xl text-xs text-neutral-600">
                  {video.duration} durasi
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
                <div className="inline-flex items-center gap-2.5 border border-ink bg-white px-3.5 py-2 shadow-[4px_4px_0px_#0D0D0D]">
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
          ))}
        </div>

        <div className="grid grid-cols-3 items-center pt-5 font-mono text-xs">
          <div className="text-left text-neutral-500">youtube.com/{CHANNEL.handle}</div>
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
            </a>
          </div>
          <div className="text-right">
            <Link
              href="/videos"
              className="group inline-block text-right"
            >
              <span className="block text-xl font-black uppercase tracking-tight text-ink transition-all duration-300 group-hover:translate-x-1.5 group-hover:text-forest sm:text-2xl">
                NEXT →
              </span>
              <span className="text-[10px] text-neutral-500">Browse all {videos.length}</span>
            </Link>
          </div>
        </div>
      </Reveal>

      <VideoModal />
    </>
  );
}