import { cacheLife, cacheTag } from "next/cache";
import { contentClient } from "./sanity";

/**
 * Copy for the /videos page's three section heads.
 *
 * Reads the `videosPage` singleton from Sanity and falls back to the strings
 * the page hard-coded before the CMS owned them, so the page renders before an
 * editor has filled the document in — and keeps rendering if Sanity is
 * unreachable.
 *
 * The small notes have three states, not two: a note that was never filled in
 * means "compute it" (the page renders the live counts, e.g. "9 episode
 * pilihan"), an empty note means the editor cleared it and wants no note at
 * all, and any other text is shown as written.
 */

export const VIDEOS_PAGE_TAG = "videosPage";

export interface VideosPageCopy {
  bicaraTitle: string;
  /** null = let the page compute the live count note; "" = show nothing. */
  bicaraNote: string | null;
  bicaraLinkLabel: string;
  samsaraTitle: string;
  /** null = let the page compute the live count note; "" = show nothing. */
  samsaraNote: string | null;
  samsaraLinkLabel: string;
  playlistsTitle: string;
  /** null = let the page compute the live count note; "" = show nothing. */
  playlistsNote: string | null;
  /** Where the values came from, for debugging. */
  source: "cms" | "static";
}

const STATIC: VideosPageCopy = {
  bicaraTitle: "Bicara Melodi",
  bicaraNote: null,
  bicaraLinkLabel: "Lihat semua episode",
  samsaraTitle: "Melodi Samsara",
  samsaraNote: null,
  samsaraLinkLabel: "YouTube Channel",
  playlistsTitle: "Playlists",
  playlistsNote: null,
  source: "static",
};

const PAGE_QUERY = /* groq */ `*[_type == "videosPage"][0]{
  bicaraTitle, bicaraNote, bicaraLinkLabel,
  samsaraTitle, samsaraNote, samsaraLinkLabel,
  playlistsTitle, playlistsNote
}`;

interface PageDoc {
  bicaraTitle?: string;
  bicaraNote?: string;
  bicaraLinkLabel?: string;
  samsaraTitle?: string;
  samsaraNote?: string;
  samsaraLinkLabel?: string;
  playlistsTitle?: string;
  playlistsNote?: string;
}

/** An empty field in the CMS means "not filled in yet", not "blank it out". */
function or(value: string | undefined, fallback: string): string {
  return value && value.trim() ? value : fallback;
}

/** An empty note means "show nothing"; a note that was never set means "compute". */
function note(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : "";
}

export async function getVideosPageCopy(): Promise<VideosPageCopy> {
  "use cache";
  cacheLife("minutes");
  cacheTag(VIDEOS_PAGE_TAG);

  let doc: PageDoc | null = null;
  try {
    doc = await contentClient.fetch<PageDoc | null>(PAGE_QUERY, {}, { cache: "no-store" });
  } catch {
    return STATIC;
  }

  if (!doc) return STATIC;

  return {
    bicaraTitle: or(doc.bicaraTitle, STATIC.bicaraTitle),
    bicaraNote: note(doc.bicaraNote),
    bicaraLinkLabel: or(doc.bicaraLinkLabel, STATIC.bicaraLinkLabel),
    samsaraTitle: or(doc.samsaraTitle, STATIC.samsaraTitle),
    samsaraNote: note(doc.samsaraNote),
    samsaraLinkLabel: or(doc.samsaraLinkLabel, STATIC.samsaraLinkLabel),
    playlistsTitle: or(doc.playlistsTitle, STATIC.playlistsTitle),
    playlistsNote: note(doc.playlistsNote),
    source: "cms",
  };
}
