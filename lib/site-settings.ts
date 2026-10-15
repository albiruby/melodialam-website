import { cacheLife, cacheTag } from "next/cache";
import { TICKER_ITEMS } from "./content";
import { SITE } from "./site";
import { contentClient } from "./sanity";

/**
 * Site-wide copy.
 *
 * Reads the `siteSettings` singleton from Sanity and falls back to the constants
 * in `lib/site.ts` and `lib/content.ts`, so the site renders before an editor has
 * filled the document in — and keeps rendering if Sanity is unreachable.
 *
 * `url` and `locale` are deliberately NOT here: the origin has to come from the
 * environment so a preview deployment produces correct canonical URLs, and the
 * locale is a technical constant.
 *
 * Channel statistics are deliberately NOT here either. Subscriber counts, total
 * views and "last scraped" were shown in the footer and rotted the moment the
 * scrape aged: nothing refreshed them, so they drifted further from the truth
 * every day. A number nobody maintains is worse than no number.
 */

export const SETTINGS_TAG = "siteSettings";

export interface TickerItem {
  label: string;
  href: string | null;
}

export interface SiteSettings {
  name: string;
  tagline: string;
  strapline: string;
  owner: string;
  est: string;
  description: string;
  /** The small note beside a section heading. Never carries a date. */
  curationNote: string;
  tickerItems: TickerItem[];
  /** Where the values came from, for the admin UI and for debugging. */
  source: "cms" | "static";
}

const STATIC: SiteSettings = {
  name: SITE.name,
  tagline: SITE.tagline,
  strapline: SITE.strapline,
  owner: SITE.owner,
  est: SITE.est,
  description: SITE.description,
  curationNote: "kurasi redaksi",
  tickerItems: TICKER_ITEMS.map((item) => ({ label: item.label, href: item.href })),
  source: "static",
};

const SETTINGS_QUERY = /* groq */ `*[_type == "siteSettings"][0]{
  name,
  tagline,
  strapline,
  owner,
  est,
  description,
  curationNote,
  tickerItems[]{ label, href }
}`;

interface SettingsDoc {
  name?: string;
  tagline?: string;
  strapline?: string;
  owner?: string;
  est?: string;
  description?: string;
  curationNote?: string;
  tickerItems?: { label?: string; href?: string }[];
}

/** An empty field in the CMS means "not filled in yet", not "blank it out". */
function or(value: string | undefined, fallback: string): string {
  return value && value.trim() ? value : fallback;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("minutes");
  cacheTag(SETTINGS_TAG);

  let doc: SettingsDoc | null = null;
  try {
    doc = await contentClient.fetch<SettingsDoc | null>(SETTINGS_QUERY, {}, { cache: "no-store" });
  } catch {
    return STATIC;
  }

  if (!doc) return STATIC;

  const tickerItems = (doc.tickerItems ?? [])
    .filter((item): item is { label: string; href?: string } => Boolean(item?.label?.trim()))
    .map((item) => ({ label: item.label.trim(), href: item.href?.trim() || null }));

  return {
    name: or(doc.name, STATIC.name),
    tagline: or(doc.tagline, STATIC.tagline),
    strapline: or(doc.strapline, STATIC.strapline),
    owner: or(doc.owner, STATIC.owner),
    est: or(doc.est, STATIC.est),
    description: or(doc.description, STATIC.description),
    curationNote: or(doc.curationNote, STATIC.curationNote),
    tickerItems: tickerItems.length > 0 ? tickerItems : STATIC.tickerItems,
    source: "cms",
  };
}
