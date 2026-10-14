import { CHANNEL, COUNTS } from "./catalogue";

/**
 * Brand copy comes from the original design; every *number* comes from
 * melodi-alam-data.md via lib/catalogue, so the two can never drift apart.
 */
export const SITE = {
  name: "MELODI ALAM",
  tagline: "Stories, Spaces & Instruments",
  strapline: "A living ecosystem of melody",
  owner: "By Infia Pariwara Nusantara",
  est: "EST. 2017",
  description:
    "Melodi Alam adalah rumah bagi jurnalisme musik, sesi intim panggung, ruang dengar, dan perangkat audio analog di Indonesia.",
  url: "https://melodialam.id",
  locale: "id_ID",
} as const;

export interface NavItem {
  href: string;
  label: string;
  /** Small uppercase badge rendered after the label. */
  badge?: string;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Latest News" },
  { href: "/journal", label: "Journal & Stories" },
  { href: "/bicara-melodi", label: "Bicara Melodi" },
  { href: "/videos", label: "Videos", badge: "YT" },
  { href: "/pahlawan-kota", label: "Pahlawan Kota" },
  { href: "/spaces", label: "Instruments & Space" },
];

export const SUBMIT_NAV: NavItem = { href: "/submit", label: "Submit Demo" };

export const FOOTER_RUBRIKS: NavItem[] = [
  { href: "/journal", label: "#FaktaMusik & Esai Skena" },
  { href: "/bicara-melodi", label: "Bicara Melodi Podcast (Season 3)" },
  { href: "/videos", label: "Melodi Samsara Live Session" },
  { href: "/videos", label: "Melodi Taman Outdoor Session" },
  { href: "/submit", label: "Submit Demo Musisi" },
];

export const EXTERNAL_LINKS = [
  { href: "https://www.youtube.com/@melodialam/videos", label: "YouTube" },
  { href: "https://www.instagram.com/melodi.alam/?hl=en", label: "Instagram" },
  { href: "https://www.threads.com/@melodi.alam", label: "Threads" },
  { href: "https://www.tiktok.com/@melodi.alam", label: "TikTok" },
  { href: "https://linktr.ee/melodi.alam", label: "Linktree" },
  { href: "https://www.instagram.com/samsara.bogor/", label: "Samsara Bogor" },
] as const;

/**
 * Scrape values sometimes carry an editorial aside, e.g.
 * "221K (220K saat render)". The compact stats strip the trailing note; the
 * full value stays available in catalogue.json.
 */
function compact(value: string | null | undefined): string {
  if (!value) return "-";
  return value.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

/**
 * Shown in the footer. Every value is read from catalogue.json, which is
 * generated from ../melodi-alam-data.md — run `npm run catalogue` after a
 * re-scrape and these update with no code change.
 */
export const CHANNEL_FACTS = {
  youtubeSubscribers: compact(CHANNEL.subscribers),
  youtubeVideos: CHANNEL.declaredVideos != null ? String(CHANNEL.declaredVideos) : "-",
  youtubeViews: compact(CHANNEL.totalViews),
  youtubeJoined: compact(CHANNEL.joined),
  instagramFollowers: compact(CHANNEL.instagramFollowers),
  instagramPosts: compact(CHANNEL.instagramPosts),
  /** What the scrape actually found, next to what the channel declares. */
  scrapedVideos: `${COUNTS.videos} long-form`,
  scrapedShorts: `${COUNTS.shorts} shorts`,
  scrapedAt: compact(CHANNEL.scrapedAt),
} as const;