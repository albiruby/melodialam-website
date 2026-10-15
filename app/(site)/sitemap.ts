import type { MetadataRoute } from "next";
import { ARTICLES } from "@/lib/content";
import { SITE } from "@/lib/site";

/**
 * Only routes that are real URLs appear here. The video player is a modal with
 * no address of its own (ADR-0001), so there is nothing to list for it.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastArticle = ARTICLES.reduce(
    (latest, a) => (a.dateISO > latest ? a.dateISO : latest),
    ARTICLES[0]?.dateISO ?? new Date().toISOString().slice(0, 10),
  );

  const pages: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
    { path: "", priority: 1, changeFrequency: "daily" },
    { path: "/journal", priority: 0.9, changeFrequency: "daily" },
    { path: "/videos", priority: 0.8, changeFrequency: "weekly" },
    { path: "/bicara-melodi", priority: 0.7, changeFrequency: "weekly" },
    { path: "/submit", priority: 0.6, changeFrequency: "monthly" },
  ];

  return [
    ...pages.map((page) => ({
      url: `${SITE.url}${page.path}`,
      lastModified: lastArticle,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...ARTICLES.map((article) => ({
      url: `${SITE.url}/journal/${article.slug}`,
      lastModified: article.dateISO,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
