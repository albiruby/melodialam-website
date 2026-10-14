import raw from "./catalogue.json";

/**
 * Typed accessors over the scraped YouTube catalogue.
 *
 * catalogue.json is generated from ../melodi-alam-data.md by
 * scripts/build-catalogue.mjs — 292 long-form videos, 342 Shorts, 5 playlists.
 * Regenerate with: `npm run catalogue`
 */

export interface CatalogueVideo {
  id: string;
  title: string;
  duration: string;
  seconds: number;
  views: string;
  uploaded: string;
  ageBucket: string | null;
  featuring: string[];
  venue: string;
  url: string;
}

export interface CatalogueShort {
  id: string;
  title: string;
  views: string;
  url: string;
}

export interface CataloguePlaylist {
  id: string;
  title: string;
  count: string;
  url: string;
}

interface ProfileFact {
  platform: string;
  metric: string;
  value: string;
  href: string | null;
}

interface Catalogue {
  meta: {
    channelId: string | null;
    channelName: string | null;
    handle: string | null;
    handleUrl: string | null;
    subscribers: string | null;
    totalViews: string | null;
    declaredVideos: number | null;
    joined: string | null;
    country: string | null;
    instagramFollowers: string | null;
    instagramPosts: string | null;
    scrapedAt: string | null;
  };
  /** Every row of the profile table in melodi-alam-data.md, keyed `platform_metric`. */
  profile: Record<string, ProfileFact>;
  counts: {
    videos: number;
    shorts: number;
    playlists: number;
    byVenue: Record<string, number>;
  };
  videos: CatalogueVideo[];
  shorts: CatalogueShort[];
  playlists: CataloguePlaylist[];
}

export const catalogue = raw as Catalogue;

export const CHANNEL = catalogue.meta;
export const PROFILE = catalogue.profile;
export const COUNTS = catalogue.counts;
export const VIDEOS = catalogue.videos;
export const SHORTS = catalogue.shorts;
export const PLAYLISTS = catalogue.playlists;

/** Looks up a single profile row by its `platform_metric` key. */
export function fact(key: string): ProfileFact | undefined {
  return catalogue.profile[key];
}

export function factValue(key: string, fallback = "-"): string {
  return catalogue.profile[key]?.value ?? fallback;
}

/** Venue filter order — Melodi Alam's own formats first, the archive last. */
export const VENUES = [
  "Melodi Samsara",
  "Melodi Taman",
  "Interview",
  "Arsip & Lainnya",
] as const;

export type Venue = (typeof VENUES)[number];

export const VENUE_COUNTS: Record<string, number> = VENUES.reduce(
  (acc, venue) => {
    acc[venue] = COUNTS.byVenue[venue] ?? 0;
    return acc;
  },
  {} as Record<string, number>,
);

export function getVideo(id: string): CatalogueVideo | undefined {
  return VIDEOS.find((v) => v.id === id);
}

export function videosByIds(ids: string[]): CatalogueVideo[] {
  return ids.map(getVideo).filter((v): v is CatalogueVideo => Boolean(v));
}

/** Newest first, matching how the channel itself orders its Videos tab. */
export function videosByVenue(venue: string | "all"): CatalogueVideo[] {
  return venue === "all" ? VIDEOS : VIDEOS.filter((v) => v.venue === venue);
}

export function topVideos(n: number): CatalogueVideo[] {
  return [...VIDEOS].sort((a, b) => viewCount(b.views) - viewCount(a.views)).slice(0, n);
}

export function latestVideos(n: number): CatalogueVideo[] {
  return VIDEOS.slice(0, n);
}

/**
 * Turns YouTube's rounded display strings ("107K", "1.8K", "166") into a number
 * so listings can be sorted by real magnitude. Returns -1 when unparseable.
 */
export function viewCount(views: string): number {
  const cleaned = views.replace(/[^\d.,KM]/gi, "").replace(/,/g, "");
  const match = cleaned.match(/^([\d.]+)\s*([KM])?$/i);
  if (!match) return -1;
  const base = Number(match[1]);
  if (Number.isNaN(base)) return -1;
  const suffix = (match[2] ?? "").toUpperCase();
  if (suffix === "K") return base * 1_000;
  if (suffix === "M") return base * 1_000_000;
  return base;
}

export function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function thumbnailFor(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}