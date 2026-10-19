import { cacheLife, cacheTag } from "next/cache";
import { contentClient, imageUrl } from "./sanity";

/**
 * Curated Instagram posts, grouped by content pillar.
 *
 * The pool lives in the Studio ("Konten Pillar"); the Stories and Videos pages
 * render the first few of each pillar as "Dari Feed" sections. There is no
 * static fallback on purpose — this is new content with no build-time source,
 * so an empty read simply hides the sections.
 */

export const PILLARS_TAG = "pillar-posts";

export const PILLAR_LABELS: Record<string, string> = {
  "fakta-musik": "Fakta Musik",
  lirik: "Lirik",
  trivia: "Trivia",
  kutipan: "Kutipan Melodi Alam",
  rekomendasi: "Rekomendasi Melodi",
  "ulas-melodi": "Ulas Melodi",
  clipper: "Clipper",
  "similar-song": "Similar Song",
  "meme-humor": "Meme Humor",
};

/** Photo pillars render on Stories; reel pillars render on Videos. */
export const PHOTO_PILLARS = ["fakta-musik", "lirik", "trivia", "kutipan"];
export const REEL_PILLARS = ["rekomendasi", "ulas-melodi", "clipper", "similar-song"];

export interface PillarPost {
  id: string;
  pillar: string;
  title: string;
  mediaType: "foto" | "reel";
  /** ISO yyyy-mm-dd, or null when the editor left it empty. */
  date: string | null;
  igUrl: string;
  /** Sanity CDN URL, or null when no image was uploaded. */
  image: string | null;
}

const PILLAR_QUERY = /* groq */ `*[_type == "pillarPost" && defined(igUrl) && defined(title)]
  | order(coalesce(order, 9999) asc, date desc) {
  "id": _id,
  pillar,
  title,
  mediaType,
  date,
  igUrl,
  image
}`;

interface PillarDoc {
  id?: string;
  pillar?: string;
  title?: string;
  mediaType?: string;
  date?: string;
  igUrl?: string;
  image?: unknown;
}

export async function allPillarPosts(): Promise<PillarPost[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(PILLARS_TAG);

  try {
    const docs = await contentClient.fetch<PillarDoc[]>(PILLAR_QUERY, {}, { cache: "no-store" });

    return docs
      .filter((d): d is PillarDoc & { id: string; title: string; igUrl: string } =>
        Boolean(d.id && d.title && d.igUrl),
      )
      .map((d) => ({
        id: d.id,
        pillar: d.pillar ?? "",
        title: d.title,
        mediaType: d.mediaType === "reel" ? ("reel" as const) : ("foto" as const),
        date: typeof d.date === "string" && d.date ? d.date.slice(0, 10) : null,
        igUrl: d.igUrl,
        image: imageUrl(d.image, { width: 900 }),
      }));
  } catch {
    // Sections simply do not render when the pool is unreachable.
    return [];
  }
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** "2026-03-04" -> "4 Mar 2026". Empty string when the date is missing. */
export function pillarDate(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}
