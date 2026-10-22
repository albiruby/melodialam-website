import { cacheLife, cacheTag } from "next/cache";
import { INTERVIEW_ROWS } from "./content-fallback";
import { contentClient } from "./sanity";

/**
 * The curated Bicara Melodi index.
 *
 * This is the editor's short list of episodes worth featuring, not a mirror of
 * the catalogue. The card artwork is the episode's YouTube thumbnail, drawn by
 * `YoutubeThumb` from `youtubeId` — which is why this type has no image field:
 * a stored cover would be a second thing to keep in sync with the video it
 * points at.
 */

export const INTERVIEWS_TAG = "interviews";

export interface SiteInterview {
  slug: string;
  artist: string;
  headline: string;
  videoId: string;
  caption: string;
  source: "cms" | "static";
}

const STATIC: SiteInterview[] = INTERVIEW_ROWS.map((row) => ({
  slug: row.slug,
  artist: row.artist,
  headline: row.headline,
  videoId: row.videoId,
  caption: row.caption,
  source: "static",
}));

const INTERVIEW_QUERY = /* groq */ `*[_type == "interview"] | order(coalesce(order, 9999) asc, artist asc) {
  "slug": slug.current,
  artist,
  headline,
  youtubeId,
  caption
}`;

interface InterviewDoc {
  slug?: string;
  artist?: string;
  headline?: string;
  youtubeId?: string;
  caption?: string;
}

/** Falls back to the artist name so a missing slug cannot break the key. */
function slugFor(doc: InterviewDoc): string {
  if (doc.slug) return doc.slug;
  return String(doc.artist ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function allInterviews(): Promise<SiteInterview[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(INTERVIEWS_TAG);

  try {
    const docs = await contentClient.fetch<InterviewDoc[]>(
      INTERVIEW_QUERY,
      {},
      { cache: "no-store" },
    );

    const rows = docs
      .filter((d): d is InterviewDoc & { artist: string; headline: string; youtubeId: string } =>
        Boolean(d.artist && d.headline && d.youtubeId),
      )
      .map((d) => ({
        slug: slugFor(d),
        artist: d.artist,
        headline: d.headline,
        videoId: d.youtubeId,
        caption: d.caption ?? "",
        source: "cms" as const,
      }));

    if (rows.length > 0) return rows;
  } catch {
    // Sanity unreachable: the rows in lib/content-fallback.ts still fill the index.
  }

  return STATIC;
}
