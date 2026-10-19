import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCards";
import { PillarCard, PillarHead } from "@/components/PillarCards";
import { Reveal } from "@/components/Reveal";
import { allArticles } from "@/lib/articles";
import { allPillarPosts, PILLAR_LABELS, PHOTO_PILLARS } from "@/lib/pillars";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Stories",
  description:
    "Catatan redaksi Melodi Alam: esai skena musik, rekomendasi melodi, catatan wawancara Bicara Melodi, dan liputan panggung.",
};

/** How many curated posts each "Dari Feed" pillar shows; the rest lives on Instagram. */
const PILLAR_LIMIT = 6;

export default async function JournalPage() {
  // Sanity when it is configured, the static file otherwise.
  const [articles, settings, feed] = await Promise.all([
    allArticles(),
    getSiteSettings(),
    allPillarPosts(),
  ]);

  // The photo pillars ride with Stories; reel pillars live on /videos.
  const photoPillars = PHOTO_PILLARS.map((key) => ({
    key,
    label: PILLAR_LABELS[key] ?? key,
    pool: feed.filter((post) => post.pillar === key),
  })).filter((pillar) => pillar.pool.length > 0);

  return (
    <Reveal>
      <div className="flex items-baseline justify-between pb-4">
        <h2 className="text-4xl tracking-tight sm:text-5xl">Stories</h2>
        <span className="font-serif text-sm italic text-neutral-600">
          ({settings.curationNote})
        </span>
      </div>

      {/* One pool, newest first — no filters, no search, no counter. */}
      <div className="grid grid-cols-1 gap-8 border-b border-ink pb-10 pt-8 sm:grid-cols-2 lg:grid-cols-4">
        {articles.map((article, i) => (
          <div key={article.slug} className="relative">
            <ArticleCard
              article={article}
              titleFirst={i % 2 === 1}
              index={i}
              readLabel={settings.cardCurtain.articleLabel}
              noteCta={settings.cardCurtain.articleCta}
            />
          </div>
        ))}
      </div>

      {/* ---------- Dari Feed: the photo pillars ---------- */}
      {photoPillars.length > 0 ? (
        <div className="pt-12">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-500">
            Dari Feed @melodi.alam — kurasi tim
          </span>
          {photoPillars.map((pillar) => (
            <section key={pillar.key} className="pt-6">
              <PillarHead label={pillar.label} note={`${pillar.pool.length} post kurasi`} />
              <div className="grid grid-cols-1 gap-6 border-b border-ink py-6 sm:grid-cols-2 lg:grid-cols-3">
                {pillar.pool.slice(0, PILLAR_LIMIT).map((post) => (
                  <PillarCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </Reveal>
  );
}
