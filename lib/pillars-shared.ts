/**
 * The pillar vocabulary, safe to import from a client component.
 *
 * `lib/pillars.ts` reads Sanity and uses `next/cache`, so it cannot travel into
 * a client bundle. Everything here is data and a date formatter: labels, the
 * two pillar sets, the shape of a post, and `pillarDate`.
 */

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
export const PHOTO_PILLARS = ["fakta-musik", "lirik", "trivia", "kutipan", "meme-humor"];
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
  /** Intrinsic image dimensions, so cards can show the full frame (no crop). */
  imageWidth: number | null;
  imageHeight: number | null;
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** "2026-03-04" -> "4 Mar 2026". Empty string when the date is missing. */
export function pillarDate(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}
