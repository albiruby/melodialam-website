/**
 * Relative date labels, with a hard stop at 30 days.
 *
 * VICE-style "3 hours ago" works because that newsroom publishes hourly.
 * Melodi Alam is a curated archive: most posts are months old, so a page
 * plastered with "2 tahun lalu" is worse than the date itself. The hybrid:
 * fresh content reads as relative, everything older keeps its absolute date
 * (the caller supplies it as the fallback).
 *
 * Article and pillar dates are date-only ("2026-06-16"), so the buckets are
 * day-granular — there is no hour component to read. "Today" is read in
 * Asia/Jakarta, the publication's own timezone, so a post published late in
 * the WIB evening is still "Hari ini" on the next UTC morning.
 */

const JAKARTA = "Asia/Jakarta";
const DAY_MS = 86_400_000;

/** "2026-06-16" -> the UTC-midnight timestamp of that calendar day, or null. */
function parseIsoDay(iso: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const time = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(time) ? null : time;
}

/** Today's calendar day in Asia/Jakarta, as a UTC-midnight timestamp. */
export function jakartaToday(now: Date = new Date()): number {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const time = Date.parse(`${day}T00:00:00Z`);
  return Number.isNaN(time) ? 0 : time;
}

/**
 * Age label for a date-only ISO string.
 *
 * `fallback` is the caller's existing absolute label ("10 Oktober 2026" on
 * article cards, "3 Jun 2026" on pillar cards); it is returned unchanged for
 * anything 30 days or older, so each surface keeps the format it already had.
 */
export function relativeDate(
  iso: string | null | undefined,
  fallback: string,
  now: Date = new Date(),
): string {
  const time = parseIsoDay((iso ?? "").trim());
  if (time === null) return fallback;

  const days = Math.round((jakartaToday(now) - time) / DAY_MS);
  // A future date (editor typo) reads as today rather than inventing an age.
  if (days <= 0) return "Hari ini";
  if (days === 1) return "Kemarin";
  if (days < 7) return `${days} hari lalu`;
  if (days < 30) return `${Math.floor(days / 7)} minggu lalu`;
  return fallback;
}
