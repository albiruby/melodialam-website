import type { Metadata } from "next";
import Link from "next/link";
import { VideosBrowser } from "@/components/VideosBrowser";
import { VideoModal } from "@/components/VideoModal";
import { allVideos } from "@/lib/videos";
import { SITE } from "@/lib/site";

/**
 * The whole video catalogue, searchable.
 *
 * `/videos` is the editorial front door: a short list of sessions, the
 * Bicara Melodi episodes and the playlists. This page is the back door —
 * every session in the catalogue, filtered by venue and searchable by title
 * or artist — so the ~270 sessions that never made the front page are still
 * reachable (and indexable).
 */
export const metadata: Metadata = {
  title: "Arsip Video",
  description:
    "Arsip katalog video Melodi Alam: live session Melodi Samsara dan Melodi Taman, bisa dicari lewat judul atau artis.",
  alternates: { canonical: `${SITE.url}/videos/arsip` },
};

export default async function VideoArchivePage() {
  const videos = await allVideos();

  return (
    <>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-ink pb-3">
        <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
          Arsip katalog video
        </span>
        <Link
          href="/videos"
          className="nav-link-anim font-bold uppercase tracking-wider text-ink transition-colors hover:text-forest"
        >
          ← Kembali ke Videos
        </Link>
      </div>

      <VideosBrowser
        videos={videos}
        heading="Arsip Video"
        note={`${videos.length} video`}
        headingLevel="h1"
      />

      <VideoModal />
    </>
  );
}
