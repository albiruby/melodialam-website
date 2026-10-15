import { cacheLife, cacheTag } from "next/cache";
import { CHANNEL, PLAYLISTS, VIDEOS, type CataloguePlaylist, type CatalogueVideo } from "./catalogue";
import { contentClient } from "./sanity";

/**
 * Video data layer.
 *
 * Same rule as articles: the CMS wins when it has an entry, the build-time
 * catalogue is what is left. An editor adds a video by hand in the Studio, and a
 * `youtubeId` that already exists in the catalogue replaces that entry — which is
 * what makes promoting or correcting an archived video a one-document job rather
 * than an import.
 *
 * The catalogue stores `uploaded` as a relative string captured at scrape time
 * ("3d ago"), so it rots: in three months every label is wrong. For CMS videos the
 * age is computed from a real `publishedAt` at render. For catalogue videos we can
 * do no better than anchor the captured offset to the scrape date, which at least
 * keeps the labels moving in the right direction instead of freezing them.
 */

export const VIDEOS_TAG = "videos";

export interface SiteVideo {
  /** YouTube id. */
  id: string;
  title: string;
  /** Formatted, e.g. "13:36". */
  duration: string;
  seconds: number;
  /** Formatted, e.g. "1.8K". */
  views: string;
  /** Age label, computed at render — never a captured string. */
  uploaded: string;
  featuring: string[];
  venue: string;
  url: string;
  featured?: boolean;
  source: "cms" | "catalogue";
}

export interface SitePlaylist {
  id: string;
  title: string;
  count: string;
  url: string;
}

/* --- Age ---------------------------------------------------------------- */

const MONTHS_ID = [
  "januari",
  "februari",
  "maret",
  "april",
  "mei",
  "juni",
  "juli",
  "agustus",
  "september",
  "oktober",
  "november",
  "desember",
];

/** "14 Oktober 2026" → Date, or null when it cannot be read. */
function parseIndonesianDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = value.trim().match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!match) return null;
  const month = MONTHS_ID.indexOf(match[2].toLowerCase());
  if (month === -1) return null;
  return new Date(Date.UTC(Number(match[3]), month, Number(match[1])));
}

/** "3d ago" / "2w ago" / "4mo ago" → milliseconds back from the anchor. */
function parseRelativeAge(value: string): number | null {
  const match = value.trim().match(/^(\d+)\s*(d|w|mo|y)\b/i);
  if (!match) return null;
  const n = Number(match[1]);
  switch (match[2].toLowerCase()) {
    case "d":
      return n * 86_400_000;
    case "w":
      return n * 7 * 86_400_000;
    case "mo":
      return n * 30 * 86_400_000;
    default:
      return n * 365 * 86_400_000;
  }
}

/** Matches the style the catalogue used, so both sources read the same. */
function formatAge(from: Date, now: Date): string {
  const days = Math.max(0, Math.floor((now.getTime() - from.getTime()) / 86_400_000));
  if (days === 0) return "hari ini";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/** "1.8K" → 1800, so both sources can be sorted by real magnitude. */
function parseViews(value: string): number {
  const match = value.trim().match(/^([\d.]+)\s*([KM])?$/i);
  if (!match) return -1;
  const base = Number(match[1]);
  if (Number.isNaN(base)) return -1;
  const suffix = (match[2] ?? "").toUpperCase();
  return suffix === "K" ? base * 1_000 : suffix === "M" ? base * 1_000_000 : base;
}

/** 1800 → "1.8K", matching how the catalogue already writes it. */
function formatViews(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(value);
}

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/* --- Mapping ------------------------------------------------------------ */

/**
 * The scrape date, read once — it is the anchor every catalogue age is measured
 * from. Without it a captured "3d ago" has no meaning at all.
 */
const CATALOGUE_ANCHOR = parseIndonesianDate(CHANNEL.scrapedAt);

function fromCatalogue(video: CatalogueVideo, now: Date): SiteVideo {
  const offset = parseRelativeAge(video.uploaded);
  // "3d ago" means three days BEFORE the scrape, so the offset is subtracted —
  // adding it dates the video in the future and every age collapses to "today".
  const uploaded =
    CATALOGUE_ANCHOR && offset !== null
      ? formatAge(new Date(CATALOGUE_ANCHOR.getTime() - offset), now)
      : video.uploaded;

  return {
    id: video.id,
    title: video.title,
    duration: video.duration,
    seconds: video.seconds,
    views: video.views,
    uploaded,
    featuring: video.featuring,
    venue: video.venue,
    url: video.url,
    source: "catalogue",
  };
}

interface CmsVideoDoc {
  youtubeId?: string;
  title?: string;
  publishedAt?: string;
  durationSeconds?: number;
  views?: number;
  venue?: string;
  featuring?: string[];
  featured?: boolean;
}

function fromCms(doc: CmsVideoDoc, now: Date): SiteVideo | null {
  if (!doc.youtubeId || !doc.title) return null;

  const published = doc.publishedAt ? new Date(doc.publishedAt) : null;
  const seconds = typeof doc.durationSeconds === "number" ? doc.durationSeconds : 0;
  const views = typeof doc.views === "number" ? doc.views : 0;

  return {
    id: doc.youtubeId,
    title: doc.title,
    duration: formatDuration(seconds),
    seconds,
    views: formatViews(views),
    uploaded: published && !Number.isNaN(published.getTime()) ? formatAge(published, now) : "",
    featuring: Array.isArray(doc.featuring) ? doc.featuring : [],
    venue: doc.venue ?? "Arsip & Lainnya",
    url: `https://www.youtube.com/watch?v=${doc.youtubeId}`,
    featured: doc.featured === true,
    source: "cms",
  };
}

const VIDEO_FIELDS = /* groq */ `{
  youtubeId,
  title,
  publishedAt,
  durationSeconds,
  views,
  venue,
  featuring,
  featured
}`;

const ALL_VIDEOS_QUERY = /* groq */ `*[_type == "video" && defined(youtubeId)] | order(publishedAt desc) ${VIDEO_FIELDS}`;

const PLAYLIST_QUERY = /* groq */ `*[_type == "playlist"] | order(coalesce(order, 9999) asc, count desc) {
  "id": playlistId,
  title,
  count
}`;

/* --- Public API --------------------------------------------------------- */

export async function allVideos(): Promise<SiteVideo[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(VIDEOS_TAG);

  const now = new Date();

  let docs: CmsVideoDoc[] = [];
  try {
    docs = await contentClient.fetch<CmsVideoDoc[]>(ALL_VIDEOS_QUERY, {}, { cache: "no-store" });
  } catch {
    // Sanity unreachable: the catalogue alone still fills the page.
  }

  // The query already orders by publishedAt desc, and these carry real dates.
  const curated = docs
    .map((doc) => fromCms(doc, now))
    .filter((v): v is SiteVideo => v !== null);
  const replaced = new Set(curated.map((v) => v.id));

  // Then the archive, in the order the scrape recorded it — also newest first.
  const archive = VIDEOS.filter((v) => !replaced.has(v.id)).map((v) => fromCatalogue(v, now));

  return [...curated, ...archive];
}

export async function allPlaylists(): Promise<SitePlaylist[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(VIDEOS_TAG);

  try {
    const docs = await contentClient.fetch<{ id?: string; title?: string; count?: number }[]>(
      PLAYLIST_QUERY,
      {},
      { cache: "no-store" },
    );

    const rows = docs
      .filter((d): d is { id: string; title: string; count?: number } => Boolean(d.id && d.title))
      .map((d) => ({
        id: d.id,
        title: d.title,
        count: typeof d.count === "number" ? String(d.count) : "-",
        url: `https://www.youtube.com/playlist?list=${d.id}`,
      }));

    if (rows.length > 0) return rows;
  } catch {
    // fall through to the catalogue
  }

  return PLAYLISTS.map((p: CataloguePlaylist) => ({
    id: p.id,
    title: p.title,
    count: p.count,
    url: p.url,
  }));
}

/**
 * `allVideos()` is already newest-first — curated entries then the archive — so
 * these are slices, not sorts.
 */
export function latestVideos(videos: SiteVideo[], n: number): SiteVideo[] {
  return videos.slice(0, n);
}

export function topVideos(videos: SiteVideo[], n: number): SiteVideo[] {
  return [...videos].sort((a, b) => parseViews(b.views) - parseViews(a.views)).slice(0, n);
}

export function videoById(videos: SiteVideo[], id: string): SiteVideo | undefined {
  return videos.find((v) => v.id === id);
}
