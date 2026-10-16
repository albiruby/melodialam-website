import { cacheLife, cacheTag } from "next/cache";
import { GENRE_ROWS, type GenreRow } from "./content";
import { contentClient, imageUrl } from "./sanity";

/**
 * The Pahlawan Musik Kota & Skena directory.
 *
 * Same rule as the articles: the CMS wins when it is reachable, the rows in
 * `lib/content.ts` are the fallback when it is not. When Sanity has any rows
 * they replace the static three wholesale rather than one by one — the
 * directory is a short curated list, so a row an editor deletes must actually
 * disappear from the site.
 *
 * Rows are signposts, not links: the READ/WATCH action group was removed on
 * request, so no target fields are read here.
 */

export const PAHLAWAN_TAG = "pahlawan-rows";

export interface SiteGenreRow extends GenreRow {
  /** Where this row came from. Handy in the UI and when debugging. */
  source: "static" | "cms";
}

const STATIC: SiteGenreRow[] = GENRE_ROWS.map((row) => ({ ...row, source: "static" as const }));

const STATIC_BY_SLUG = new Map(STATIC.map((row) => [row.slug, row]));

/** Fallback art when a row has neither an upload nor a carried-over path. */
const PLACEHOLDER_IMAGE = "/photos/dsc09408.webp";

const PAHLAWAN_QUERY = /* groq */ `*[_type == "pahlawanRow"] | order(coalesce(order, 9999) asc, title asc) {
  "slug": slug.current,
  title,
  artists,
  description,
  tags,
  image,
  imagePath
}`;

interface PahlawanDoc {
  slug?: string;
  title?: string;
  artists?: string;
  description?: string;
  tags?: string[];
  image?: unknown;
  imagePath?: string;
}

/** Falls back to the title so a missing slug cannot break the row key. */
function slugFor(doc: PahlawanDoc): string {
  if (doc.slug) return doc.slug;
  return String(doc.title ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function allPahlawanRows(): Promise<SiteGenreRow[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(PAHLAWAN_TAG);

  try {
    const docs = await contentClient.fetch<PahlawanDoc[]>(
      PAHLAWAN_QUERY,
      {},
      { cache: "no-store" },
    );

    const rows = docs
      .filter((d): d is PahlawanDoc & { title: string } => Boolean(d.title))
      .map((d) => {
        const slug = slugFor(d);
        return {
          slug,
          title: d.title,
          artists: d.artists ?? "",
          description: d.description ?? "",
          // An uploaded image wins; then the carried-over local path; then the
          // same-slug static row's photo; then the shared placeholder.
          image:
            imageUrl(d.image, { width: 1200 }) ??
            d.imagePath ??
            STATIC_BY_SLUG.get(slug)?.image ??
            PLACEHOLDER_IMAGE,
          tags: Array.isArray(d.tags) ? d.tags.filter((t): t is string => typeof t === "string") : [],
          source: "cms" as const,
        };
      });

    if (rows.length > 0) return rows;
  } catch {
    // Sanity unreachable: the static rows still fill the directory.
  }

  return STATIC;
}
