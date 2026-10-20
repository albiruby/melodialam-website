import type { MetadataRoute } from "next";
import { feedArticles } from "@/lib/articles";
import { SITE } from "@/lib/site";

/**
 * Only routes that are real URLs appear here. The video player is a modal with
 * no address of its own (ADR-0001), so there is nothing to list for it.
 *
 * The article list is read through `feedArticles()` rather than the static
 * `ARTICLES` array: an article an editor publishes in the Studio has a real
 * URL, and a sitemap built from the file would never mention it.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await feedArticles();
  const lastArticle = articles[0]?.dateISO ?? new Date().toISOString().slice(0, 10);

  const pages: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
    { path: "", priority: 1, changeFrequency: "daily" },
    { path: "/journal", priority: 0.9, changeFrequency: "daily" },
    { path: "/videos", priority: 0.8, changeFrequency: "weekly" },
    { path: "/videos/arsip", priority: 0.6, changeFrequency: "weekly" },
    { path: "/kurasi", priority: 0.8, changeFrequency: "weekly" },
    { path: "/bicara-melodi", priority: 0.7, changeFrequency: "weekly" },
    { path: "/tentang", priority: 0.5, changeFrequency: "monthly" },
    { path: "/submit", priority: 0.6, changeFrequency: "monthly" },
  ];

  return [
    ...pages.map((page) => ({
      url: `${SITE.url}${page.path}`,
      lastModified: lastArticle,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    // Only the feed-photo stories are advertised: they are the ones the
    // sections carry. A reel story keeps its URL but is not offered here.
    ...articles.map((article) => ({
      url: `${SITE.url}/journal/${article.slug}`,
      lastModified: article.dateISO,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
