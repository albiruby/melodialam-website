/**
 * Brand copy. Everything here is hand-written; nothing is derived from the
 * scrape, so there is nothing to drift.
 */
export const SITE = {
  name: "MELODI ALAM",
  tagline: "Stories & Watch",
  strapline: "A living ecosystem of melody",
  owner: "By Infia Pariwara Nusantara",
  est: "EST. 2017",
  description:
    "Melodi Alam adalah rumah bagi jurnalisme musik, sesi intim panggung, ruang dengar, dan perangkat audio analog di Indonesia.",
  /**
   * Canonical origin. Overridable with NEXT_PUBLIC_SITE_URL so a Vercel preview
   * or a newly attached domain produces correct canonical URLs, a correct
   * sitemap and a correct robots host without touching code.
   */
  url: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "https://melodialam.id",
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
  { href: "/journal", label: "Stories" },
  { href: "/bicara-melodi", label: "Bicara Melodi" },
  { href: "/videos", label: "Melodi Samsara", badge: "YT" },
  { href: "/kurasi", label: "Curated News" },
];

export const SUBMIT_NAV: NavItem = { href: "/submit", label: "Submit Karya" };

export const FOOTER_RUBRIKS: NavItem[] = [
  { href: "/journal", label: "#FaktaMusik & Esai Skena" },
  { href: "/bicara-melodi", label: "Bicara Melodi Podcast (Season 3)" },
  { href: "/videos", label: "Melodi Samsara Live Session" },
  {
    href: "https://www.youtube.com/playlist?list=PL3hstHxZXaodgPZhIreiGMzKZYbinho9J",
    label: "Melodi Taman Outdoor Session",
  },
  { href: "/tentang", label: "Tentang & Kontak" },
  { href: "/submit", label: "Submit Karya" },
];

export const EXTERNAL_LINKS = [
  { href: "https://www.youtube.com/@melodialam/videos", label: "YouTube" },
  { href: "https://www.instagram.com/melodi.alam/?hl=en", label: "Instagram" },
  { href: "https://www.threads.com/@melodi.alam", label: "Threads" },
  { href: "https://www.tiktok.com/@melodi.alam", label: "TikTok" },
  { href: "https://linktr.ee/melodi.alam", label: "Linktree" },
  { href: "https://www.instagram.com/samsara.bogor/", label: "Samsara Bogor" },
] as const;