import type { MetadataRoute } from "next";
import { allArticles } from "@/lib/articles";
import { SITE } from "@/lib/site";
import { storyPage } from "@/lib/story-pages";

/**
 * Only routes that are real URLs appear here. The video player is a modal with
 * no address of its own (ADR-0001), so there is nothing to list for it.
 *
 * The article list is read through `allArticles()` rather than the static
 * `ARTICLES` array: an article an editor publishes in the Studio has a real
 * URL, and a sitemap built from the file would never mention it. Every article
 * is listed, because every article is now reachable: page 1 of Stories carries
 * the eight the home page borrows, and the pages after it carry the rest.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, { pages: storyPages }] = await Promise.all([allArticles(), storyPage(1)]);
  const lastArticle = articles[0]?.dateISO ?? new Date().toISOString().slice(0, 10);

  const pages: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
    { path: "", priority: 1, changeFrequency: "daily" },
    { path: "/stories", priority: 0.9, changeFrequency: "daily" },
    ...Array.from({ length: Math.max(0, storyPages - 1) }, (_, i) => ({
      path: `/stories/page/${i + 2}`,
      priority: 0.4,
      changeFrequency: "monthly" as const,
    })),
    { path: "/videos", priority: 0.8, changeFrequency: "weekly" },
    { path: "/discover", priority: 0.8, changeFrequency: "weekly" },
    { path: "/bicara-melodi", priority: 0.7, changeFrequency: "weekly" },
    { path: "/tentang", priority: 0.5, changeFrequency: "monthly" },
    { path: "/submit", priority: 0.6, changeFrequency: "monthly" },
    { path: "/privasi", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/ketentuan", priority: 0.3, changeFrequency: "yearly" as const },
  ];

  return [
    ...pages.map((page) => ({
      url: `${SITE.url}${page.path}`,
      lastModified: lastArticle,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    // Every article, in the order the Stories pages present them.
    ...articles.map((article) => ({
      url: `${SITE.url}/stories/${article.slug}`,
      lastModified: article.dateISO,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
