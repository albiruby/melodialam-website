import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { FeatureCard, HeroArticle } from "@/components/ArticleCards";
import { allArticles } from "@/lib/articles";
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
  const articles = await allArticles();
  // "Latest News" is simply the four newest; `allArticles()` is newest-first.
  const [hero, ...rest] = articles;
  const subFeatures = rest.slice(0, 3);

  // Sanity first, the build-time catalogue behind it. Only the counts line
  // reads `videos` now — the interview and video teasers were removed on
  // request (they repeated /bicara-melodi and /videos verbatim).
  const [videos, settings] = await Promise.all([allVideos(), getSiteSettings()]);

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
    </>
  );
}
