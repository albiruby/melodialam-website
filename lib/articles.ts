import { cacheLife, cacheTag } from "next/cache";
import { ARTICLES, type Article, type ArticleCategory } from "./content";
import { getPayloadClient } from "./payload";

/**
 * Article data layer.
 *
 * One rule: the CMS wins when the database is reachable, the static file is the
 * fallback when it is not. That keeps two promises at once —
 *
 *  - what an editor publishes in `/admin` shows up on the site without a code
 *    change, and
 *  - a fresh checkout with no `DATABASE_URL` still renders the twelve articles
 *    that live in `lib/content.ts`.
 *
 * Collisions resolve in favour of the CMS, which is what makes the migration
 * gradual: seed an article into Payload and it takes over from that moment,
 * with nothing to delete from the static file until the move is done.
 */

export interface SiteArticle extends Article {
  /**
   * Lexical editor state, present only for CMS articles. The reader renders it
   * through Payload's own `<RichText>` so headings, lists, quotes and uploads
   * survive; `body` above stays the plain-text projection used for reading time
   * and search.
   */
  richBody?: unknown;
  /** Where this article came from. Handy in the admin UI and when debugging. */
  source: "static" | "cms";
}

const STATIC: SiteArticle[] = ARTICLES.map((a) => ({ ...a, source: "static" as const }));

/** Flattens a Lexical node tree into plain paragraphs. */
function lexicalToParagraphs(node: unknown): string[] {
  const out: string[] = [];

  const walk = (n: unknown): void => {
    if (!n || typeof n !== "object") return;
    const rec = n as Record<string, unknown>;

    if (rec.type === "text" && typeof rec.text === "string") return;
    if (Array.isArray(rec.children)) {
      const before = out.length;
      rec.children.forEach(walk);
      // A leaf block whose children produced text becomes one paragraph.
      if (out.length === before && typeof rec.text === "string" && rec.text.trim()) {
        out.push(rec.text.trim());
      }
    }
  };

  // Lexical wraps everything in a root node.
  const root = (node as { root?: unknown })?.root ?? node;
  const children = (root as { children?: unknown[] })?.children;
  if (Array.isArray(children)) {
    for (const block of children) {
      const text = collectText(block);
      if (text) out.push(text);
    }
  } else {
    walk(node);
  }

  return out;
}

/** Concatenates every text node under a block, joining paragraphs with a space. */
function collectText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const rec = node as Record<string, unknown>;

  if (typeof rec.text === "string") return rec.text;
  if (!Array.isArray(rec.children)) return "";

  return rec.children
    .map(collectText)
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Upload fields arrive as an id or a populated doc depending on `depth`. */
function mediaUrl(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return null;
  const url = (value as { url?: unknown }).url;
  return typeof url === "string" ? url : null;
}

/** A Payload article document → the shape the site's UI already speaks. */
function fromCms(doc: Record<string, unknown>): SiteArticle | null {
  const slug = typeof doc.slug === "string" ? doc.slug : null;
  const title = typeof doc.title === "string" ? doc.title : null;
  if (!slug || !title) return null;

  const image = mediaUrl(doc.image);
  const iso = typeof doc.date === "string" ? doc.date.slice(0, 10) : null;

  return {
    slug,
    title,
    category: (typeof doc.category === "string" ? doc.category : "Fakta Musik") as ArticleCategory,
    date: iso ? formatDate(iso) : "",
    dateISO: iso ?? "",
    excerpt: typeof doc.excerpt === "string" ? doc.excerpt : "",
    // Falls back to the media doc's own URL; the placeholder set is only used
    // when an article somehow has no image at all.
    image: image ?? "/photos/dsc09408.webp",
    body: lexicalToParagraphs(doc.body),
    featured: doc.featured === true,
    richBody: doc.body,
    source: "cms",
  };
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

/**
 * Cache tag for every article read. Payload's `afterChange` / `afterDelete`
 * hooks on the articles collection call `revalidateTag(ARTICLES_TAG)`, so
 * publishing in `/admin` invalidates this immediately rather than waiting for
 * the cache window to lapse.
 */
export const ARTICLES_TAG = "articles";

export async function allArticles(): Promise<SiteArticle[]> {
  "use cache";
  // A news site: fresh within minutes, and revalidated on publish anyway.
  cacheLife("minutes");
  cacheTag(ARTICLES_TAG);

  const payload = await getPayloadClient();
  if (!payload) return STATIC;

  try {
    const found = await payload.find({
      collection: "articles",
      where: { _status: { equals: "published" } },
      sort: "-date",
      limit: 500,
      depth: 1,
      overrideAccess: true,
    });

    const bySlug = new Map(STATIC.map((a) => [a.slug, a]));
    for (const doc of found.docs) {
      const article = fromCms(doc as unknown as Record<string, unknown>);
      // CMS replaces the static article of the same slug.
      if (article) bySlug.set(article.slug, article);
    }

    return [...bySlug.values()].sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  } catch {
    // Database unreachable mid-request: the site keeps working from the file.
    return STATIC;
  }
}

export async function articleBySlug(slug: string): Promise<SiteArticle | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(ARTICLES_TAG);

  const payload = await getPayloadClient();
  if (!payload) return STATIC.find((a) => a.slug === slug) ?? null;

  try {
    const found = await payload.find({
      collection: "articles",
      where: { and: [{ slug: { equals: slug } }, { _status: { equals: "published" } }] },
      limit: 1,
      depth: 1,
      overrideAccess: true,
    });

    const doc = found.docs[0];
    if (doc) {
      const article = fromCms(doc as unknown as Record<string, unknown>);
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
