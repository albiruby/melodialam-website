import { ArticleCard } from "@/components/ArticleCards";
import type { SiteArticle } from "@/lib/articles";
import type { SiteSettings } from "@/lib/site-settings";

/**
 * The Stories grid. One component so page 1 and the pages after it cannot
 * drift apart in spacing or in the alternating headline/photo rhythm.
 */
export function StoriesGrid({
  articles,
  settings,
}: {
  articles: SiteArticle[];
  settings: SiteSettings;
}) {
  return (
    <div className="grid grid-cols-1 gap-8 border-b border-ink pb-10 pt-8 sm:grid-cols-2 lg:grid-cols-4">
      {articles.map((article, index) => (
        <div key={article.slug} className="relative">
          <ArticleCard
            article={article}
            titleFirst={index % 2 === 1}
            index={index}
            readLabel={settings.cardCurtain.articleLabel}
            noteCta={settings.cardCurtain.articleCta}
          />
        </div>
      ))}
    </div>
  );
}
