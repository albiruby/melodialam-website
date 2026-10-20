import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCards";
import { Reveal } from "@/components/Reveal";
import { allArticles } from "@/lib/articles";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Stories",
  description:
    "Catatan redaksi Melodi Alam: esai skena musik, rekomendasi melodi, catatan wawancara Bicara Melodi, dan liputan panggung.",
  alternates: { canonical: "/journal" },
};

export default async function JournalPage() {
  // Sanity when it is configured, the static file otherwise.
  const [articles, settings] = await Promise.all([allArticles(), getSiteSettings()]);

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

      {/* ---------- Dari Feed → Kurasi ---------- */}
      <div className="flex items-center justify-between pt-4 font-mono text-xs text-neutral-500">
        <span>Konten kurasi dari feed @melodi.alam</span>
        <Link
          href="/kurasi"
          className="nav-link-anim font-bold uppercase tracking-wider text-ink transition-colors hover:text-forest"
        >
          Kurasi ↗
        </Link>
      </div>
    </Reveal>
  );
}
