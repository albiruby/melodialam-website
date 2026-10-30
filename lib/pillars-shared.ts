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
};

/** Photo pillars render on Stories; reel pillars render on Videos. */
export const PHOTO_PILLARS = ["fakta-musik", "lirik", "trivia", "kutipan"];
export const REEL_PILLARS = ["rekomendasi", "ulas-melodi", "clipper"];

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

/**
 * How a feed cover should fill its fixed 4:5 frame.
 *
 * The grid keeps one frame shape, but an image that is not close to 4:5 should
 * not be cropped: `contain` shows the whole frame on the neutral background.
 * A 4:5 cover (or close enough) still fills the tile.
 */
export function coverFit(
  post: Pick<PillarPost, "imageWidth" | "imageHeight">,
): "cover" | "contain" {
  const { imageWidth: width, imageHeight: height } = post;
  if (!width || !height) return "cover";
  return Math.abs(width / height - 4 / 5) <= 0.08 ? "cover" : "contain";
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** "2026-03-04" -> "4 Mar 2026". Empty string when the date is missing. */
export function pillarDate(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}
