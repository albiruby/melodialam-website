/**
 * Shared vocabulary: the editorial desks and the demo-queue enums.
 *
 * Both the Sanity schema and `lib/content.ts` need these values, and they must
 * agree — the CMS stores the raw string and the site narrows it back on read.
 * They live in their own module because the Studio bundle imports this file, and
 * importing `lib/content.ts` instead would drag all twelve articles into that
 * bundle with it.
 *
 * `lib/content.ts` re-exports everything here, so existing imports keep working.
 */

/* --- Articles ------------------------------------------------------------ */

export const ARTICLE_CATEGORY_VALUES = [
  "Fakta Musik",
  "Rekomendasi Melodi",
  "Bicara Melodi",
  "Liputan Panggung",
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORY_VALUES)[number];

/** The long form shown in the UI; the stored value is the short one. */
export const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  "Fakta Musik": "Fakta Musik & Esai",
  "Rekomendasi Melodi": "Rekomendasi Melodi",
  "Bicara Melodi": "Bicara Melodi Notes",
  "Liputan Panggung": "Liputan & Gig Report",
};

export const ARTICLE_CATEGORIES: ArticleCategory[] = [...ARTICLE_CATEGORY_VALUES];

export function isArticleCategory(value: unknown): value is ArticleCategory {
  return typeof value === "string" && (ARTICLE_CATEGORY_VALUES as readonly string[]).includes(value);
}

/* --- Demo queue ---------------------------------------------------------- */

/**
 * `BR-002` — a submission always starts `IN REVIEW` and only a curator moves it
 * on. `SHORTLISTED (SAMSARA)` and `APPROVED (ARTICLE)` are the two outcomes the
 * PRD names; `ARCHIVED` is the terminal state for a reviewed-and-parked
 * submission.
 *
 * A podcast-bound submission has no outcome of its own in `BR-002`, so it stays
 * `IN REVIEW` until a curator picks one. The transition rules live in
 * docs/DATA-MODEL.md; there is no curator endpoint yet to enforce them.
 */
export const DEMO_STATUSES = [
  "IN REVIEW",
  "SHORTLISTED (SAMSARA)",
  "APPROVED (ARTICLE)",
  "ARCHIVED",
] as const;

export type DemoStatus = (typeof DEMO_STATUSES)[number];

/** The only status a public submission may be created with. */
export const DEMO_INITIAL_STATUS: DemoStatus = "IN REVIEW";

/**
 * The statuses a curator has approved, and therefore the only ones the public
 * queue may return (ADR-0005). These are the two outcomes `BR-002` names.
 */
export const DEMO_APPROVED_STATUSES = ["SHORTLISTED (SAMSARA)", "APPROVED (ARTICLE)"] as const;

/**
 * `BR-001` — audio limits. Enforced in the browser before a file is accepted,
 * and again on the route from the metadata the form reports, so a crafted
 * request cannot skip the client check.
 */
export const DEMO_AUDIO_MAX_BYTES = 25 * 1024 * 1024;
export const DEMO_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/ogg"] as const;
export const DEMO_AUDIO_EXTENSIONS = [".mp3", ".wav", ".ogg"] as const;

export interface DemoSubmission {
  id: string;
  artist: string;
  city: string;
  title: string;
  genre: string;
  program: string;
  link: string;
  story: string;
  status: DemoStatus;
  submittedAt: string;
}

export const DEMO_GENRES = [
  "Indie Pop / Folk",
  "Alternative Rock / Shoegaze",
  "Surf Rock / Punk",
  "R&B / Soul / Jazz",
  "Ska / Reggae / Dub",
  "Electronic / Experimental",
] as const;

export const DEMO_PROGRAMS = [
  "Review Artikel dan Rekomendasi IG",
  "Live at Melodi Samsara",
  "Tamu Podcast Bicara Melodi",
] as const;

/** The list shape Sanity's `options.list` wants, from a readonly tuple. */
export function asOptions(values: readonly string[]): { title: string; value: string }[] {
  return values.map((value) => ({ title: value, value }));
}
