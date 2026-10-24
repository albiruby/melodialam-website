import { cacheLife, cacheTag } from "next/cache";
import { allArticles, ARTICLES_TAG, latestStories, type SiteArticle } from "./articles";

/**
 * Stories, split into pages of eight.
 *
 * Page 1 is `latestStories(8)` — the feed photos first, then the newest reels —
 * because that is the order the page has always shown and the order the home
 * page borrows from. Everything that does not fit continues on page 2 in date
 * order, so the stories that were previously reachable only by their own URL
 * now have a way in from the index.
 */
export const STORIES_PAGE_SIZE = 8;

export interface StoryPage {
  /** 1-based. */
  page: number;
  articles: SiteArticle[];
  /** How many pages there are in total, at least 1. */
  pages: number;
}

/** The articles that did not make the first page, in date order. */
async function restOfStories(): Promise<SiteArticle[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(ARTICLES_TAG);

  const [first, all] = await Promise.all([latestStories(STORIES_PAGE_SIZE), allArticles()]);
  const shown = new Set(first.map((article) => article.slug));
  return all.filter((article) => !shown.has(article.slug));
}

/** One page of Stories; page 1 is the shared list, the rest continue it. */
export async function storyPage(page: number): Promise<StoryPage> {
  const rest = await restOfStories();
  const pages = 1 + Math.ceil(rest.length / STORIES_PAGE_SIZE);

  if (page <= 1) {
    return { page: 1, articles: await latestStories(STORIES_PAGE_SIZE), pages };
  }

  const start = (page - 2) * STORIES_PAGE_SIZE;
  return { page, articles: rest.slice(start, start + STORIES_PAGE_SIZE), pages };
}
