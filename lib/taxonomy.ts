/**
 * Shared vocabulary: the editorial desks and the demo-queue enums.
 *
 * These are the values the CMS stores, so anything reading that data must agree
 * on them exactly. Here they narrow what comes back out of a query and supply the
 * display labels; in `melodialam-sanity` the same list drives the Studio's field
 * options and validation.
 *
 * DUPLICATED, ON PURPOSE: `melodialam-sanity/lib/taxonomy.ts` holds the same
 * values, because the Studio cannot import from this repo at build time and this
 * repo must not depend on the Studio's. Change one, change the other.
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
  "Rekomendasi Melodi": "Fakta Musik",
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
