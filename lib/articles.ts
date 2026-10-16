import { cacheLife, cacheTag } from "next/cache";
import { ARTICLES, type Article } from "./content";
import { contentClient, imageUrl } from "./sanity";
import { isArticleCategory } from "./taxonomy";

/**
 * Article data layer.
 *
 * One rule, unchanged from the previous backend: the CMS wins when it is
 * reachable, the static file is the fallback when it is not. That keeps two
 * promises at once —
 *
 *  - what an editor publishes in the Studio shows up on the site without a code
 *    change, and
 *  - if Sanity cannot be reached, the site still renders the twelve articles in
 *    `lib/content.ts` rather than failing.
 *
 * The read client needs no credentials (the dataset is public and the project id
 * is a literal), so Sanity is the default source rather than something you opt
 * into with `.env`.
 */

export interface SiteArticle extends Article {
  /**
   * Portable Text blocks, present only for CMS articles. The reader renders
   * them through `<PortableText>` so headings, lists, quotes and inline images
   * survive; `body` above stays the plain-text projection used for reading time
   * and search.
   */
  richBody?: unknown[];
  /** Where this article came from. Handy in the UI and when debugging. */
  source: "static" | "cms";
}

/**
 * Newest first, matching the CMS query's `order(date desc)` — the home page
 * slices the head of this list for "Latest News", so both sources keep the
 * same order.
 */
const STATIC: SiteArticle[] = [...ARTICLES]
  .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
  .map((a) => ({ ...a, source: "static" as const }));

/** Fallback art when an article has no cover of its own. */
const PLACEHOLDER_IMAGE = "/photos/dsc09408.webp";

/**
 * Cache tag for every article read. `POST /api/revalidate` bumps it from a
 * Sanity webhook, so publishing invalidates this immediately rather than
 * waiting for the cache window to lapse.
 */
export const ARTICLES_TAG = "articles";

const ARTICLE_FIELDS = /* groq */ `{
  "slug": slug.current,
  title,
  category,
  date,
  excerpt,
  image,
  imagePath,
  body
}`;

const ALL_ARTICLES_QUERY = /* groq */ `*[_type == "article" && defined(slug.current)] | order(date desc) ${ARTICLE_FIELDS}`;

const ARTICLE_BY_SLUG_QUERY = /* groq */ `*[_type == "article" && slug.current == $slug][0] ${ARTICLE_FIELDS}`;

interface CmsArticleDoc {
  slug?: string;
  title?: string;
  category?: string;
  date?: string;
  excerpt?: string;
  image?: unknown;
  imagePath?: string;
  body?: unknown[];
}

/** Pulls the readable text out of Portable Text, for reading time and search. */
function portableTextToParagraphs(blocks: unknown): string[] {
  if (!Array.isArray(blocks)) return [];

  const out: string[] = [];
  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    const rec = block as Record<string, unknown>;

    // Inline images and other non-text blocks contribute nothing to the count.
    if (rec._type !== "block" || !Array.isArray(rec.children)) continue;

    const text = rec.children
      .map((child) =>
        child && typeof child === "object" && typeof (child as { text?: unknown }).text === "string"
          ? (child as { text: string }).text
          : "",
      )
      .join("")
      .trim();

    if (text) out.push(text);
  }

  return out;
}

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/** Matches the hand-written date format already used across the static file. */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** A Sanity article document → the shape the site's UI already speaks. */
function fromCms(doc: CmsArticleDoc): SiteArticle | null {
  const slug = typeof doc.slug === "string" ? doc.slug : null;
  const title = typeof doc.title === "string" ? doc.title : null;
  if (!slug || !title) return null;

  const iso = typeof doc.date === "string" ? doc.date.slice(0, 10) : "";

  return {
    slug,
    title,
    // An unknown desk falls back rather than rendering an undefined label.
    category: isArticleCategory(doc.category) ? doc.category : "Fakta Musik",
    date: iso ? formatDate(iso) : "",
    dateISO: iso,
    excerpt: typeof doc.excerpt === "string" ? doc.excerpt : "",
    // An uploaded cover wins; then the carried-over local path from the import;
    // then the shared placeholder.
    image: imageUrl(doc.image, { width: 1600 }) ?? doc.imagePath ?? PLACEHOLDER_IMAGE,
    body: portableTextToParagraphs(doc.body),
    richBody: Array.isArray(doc.body) ? doc.body : undefined,
    source: "cms",
  };
}

export async function allArticles(): Promise<SiteArticle[]> {
  "use cache";
  // A news site: fresh within minutes, and revalidated on publish anyway.
  cacheLife("minutes");
  cacheTag(ARTICLES_TAG);

  try {
    const docs = await contentClient.fetch<CmsArticleDoc[]>(ALL_ARTICLES_QUERY, {}, { cache: "no-store" });

    const bySlug = new Map(STATIC.map((a) => [a.slug, a]));
    for (const doc of docs) {
      const article = fromCms(doc);
      // The CMS replaces the static article of the same slug.
      if (article) bySlug.set(article.slug, article);
    }

    return [...bySlug.values()].sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  } catch {
    // Sanity unreachable mid-request: the site keeps working from the file.
    return STATIC;
  }
}

export async function articleBySlug(slug: string): Promise<SiteArticle | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(ARTICLES_TAG);

  try {
    const doc = await contentClient.fetch<CmsArticleDoc | null>(
      ARTICLE_BY_SLUG_QUERY,
      { slug },
      { cache: "no-store" },
    );

    if (doc) {
      const article = fromCms(doc);
      if (article) return article;
    }
  } catch {
    // fall through to the static file
  }

  return STATIC.find((a) => a.slug === slug) ?? null;
}

/** Slugs that exist as files, used to prerender them at build time. */
export function staticArticleSlugs(): string[] {
  return STATIC.map((a) => a.slug);
}
