import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { FrontCard } from "@/components/ArticleCards";
import { PillarCard } from "@/components/PillarCards";
import { feedArticles } from "@/lib/articles";
import { allPillarPosts } from "@/lib/pillars";
import { allVideos } from "@/lib/videos";
import { getSiteSettings } from "@/lib/site-settings";
import { CountUp } from "@/components/motion/CountUp";
import { RevealText } from "@/components/motion/RevealText";

export const metadata: Metadata = {
  /**
   * No `title` override on purpose. A page in the same segment as its layout does
   * not get that layout's `title.template` applied, so setting one here rendered
   * the home page as the bare tagline with no brand name in it. Inheriting the
   * layout default gives "MELODI ALAM — Stories & Watch".
   */
  description:
    "Melodi Alam: jurnalisme musik, catatan wawancara, dan katalog video sesi panggung.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  // Sanity when it is configured, the static file otherwise.
  const articles = await feedArticles();
  // "Latest News" is the four newest; `feedArticles()` is newest-first.
  const latest = articles.slice(0, 4);

  // Sanity first, the build-time catalogue behind it. The counts line reads
  // `videos`; the curated strip below the news reads the pillar pool, newest
  // first, and only the photo posts — the reel ones are video rows, not cards.
  const [videos, settings, feed] = await Promise.all([
    allVideos(),
    getSiteSettings(),
    allPillarPosts(),
  ]);

  const curated = feed
    .filter((post) => post.mediaType === "foto")
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, 4);

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

        {/* Four stories, two per row. A single full-width cover story made the
            page open with one enormous picture; the four now carry the same
            weight and the first screen already shows two of them. */}
        <div className="grid grid-cols-1 gap-x-10 border-t-2 border-ink sm:grid-cols-2">
          {latest.map((article, i) => (
            <FrontCard key={article.slug} article={article} lead={i === 0} />
          ))}
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

      {/* ---------- Curated News ---------- */}
      {/* A front page needs more than four rows of text: this strip puts the
          feed's own cards on it, and sends the reader to /kurasi for the rest. */}
      {curated.length > 0 ? (
        <Reveal>
          <div className="mt-14 flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-ink pb-3">
            <div className="flex items-baseline gap-4">
              <h2 className="text-4xl tracking-tight sm:text-5xl">
                <RevealText text="Curated News" />
              </h2>
              <span className="font-serif text-sm italic text-neutral-600">
                (pilihan tim dari feed @melodi.alam)
              </span>
            </div>
            <Link
              href="/kurasi"
              className="nav-link-anim font-bold uppercase tracking-wider text-ink transition-colors hover:text-forest"
            >
              Semua kurasi ↗
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-5 border-b border-ink py-6 lg:grid-cols-4">
            {curated.map((post) => (
              <PillarCard key={post.id} post={post} showPillar />
            ))}
          </div>
        </Reveal>
      ) : null}
    </>
  );
}
