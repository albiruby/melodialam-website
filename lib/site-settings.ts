import { cacheLife, cacheTag } from "next/cache";
import { TICKER_ITEMS } from "./content";
import { CHANNEL_FACTS, SITE } from "./site";
import { contentClient } from "./sanity";

/**
 * Site-wide copy and channel facts.
 *
 * Reads the `siteSettings` singleton from Sanity and falls back to the constants
 * in `lib/site.ts` and `lib/content.ts`, so the site renders before an editor has
 * filled the document in — and keeps rendering if Sanity is unreachable.
 *
 * `url` and `locale` are deliberately NOT here: the origin has to come from the
 * environment so a preview deployment produces correct canonical URLs, and the
 * locale is a technical constant.
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
  channelFacts: {
    youtubeSubscribers: string;
    youtubeVideos: string;
    youtubeViews: string;
    youtubeJoined: string;
    instagramFollowers: string;
    instagramPosts: string;
    scrapedVideos: string;
    scrapedShorts: string;
    scrapedAt: string;
  };
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
  channelFacts: { ...CHANNEL_FACTS },
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
  youtubeSubscribers,
  youtubeVideos,
  youtubeViews,
  youtubeJoined,
  instagramFollowers,
  instagramPosts,
  scrapedAt,
  tickerItems[]{ label, href }
}`;

interface SettingsDoc {
  name?: string;
  tagline?: string;
  strapline?: string;
  owner?: string;
  est?: string;
  description?: string;
  youtubeSubscribers?: string;
  youtubeVideos?: string;
  youtubeViews?: string;
  youtubeJoined?: string;
  instagramFollowers?: string;
  instagramPosts?: string;
  scrapedAt?: string;
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
    channelFacts: {
      youtubeSubscribers: or(doc.youtubeSubscribers, STATIC.channelFacts.youtubeSubscribers),
      youtubeVideos: or(doc.youtubeVideos, STATIC.channelFacts.youtubeVideos),
      youtubeViews: or(doc.youtubeViews, STATIC.channelFacts.youtubeViews),
      youtubeJoined: or(doc.youtubeJoined, STATIC.channelFacts.youtubeJoined),
      instagramFollowers: or(doc.instagramFollowers, STATIC.channelFacts.instagramFollowers),
      instagramPosts: or(doc.instagramPosts, STATIC.channelFacts.instagramPosts),
      // These two are derived from the catalogue, not typed by an editor.
      scrapedVideos: STATIC.channelFacts.scrapedVideos,
      scrapedShorts: STATIC.channelFacts.scrapedShorts,
      scrapedAt: or(doc.scrapedAt, STATIC.channelFacts.scrapedAt),
    },
    tickerItems: tickerItems.length > 0 ? tickerItems : STATIC.tickerItems,
    source: "cms",
  };
}
