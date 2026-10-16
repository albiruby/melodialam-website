import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { VideoRow } from "@/components/VideosBrowser";
import { VideoModal, WatchButton } from "@/components/VideoModal";
import { YoutubeThumb } from "@/components/YoutubeThumb";
import { CHANNEL } from "@/lib/catalogue";
import { allInterviews } from "@/lib/interviews";
import { allPlaylists, allVideos } from "@/lib/videos";
import { getVideosPageCopy } from "@/lib/videos-page";

export const metadata: Metadata = {
  title: "Videos",
  description:
    "Katalog video Melodi Alam: live session Melodi Samsara dan Melodi Taman, serta wawancara Bicara Melodi.",
};

/** The live sessions shown before the archive takes over — nine, to match the Bicara Melodi grid. */
const SAMSARA_PREVIEW = 9;

function SectionHead({
  title,
  note,
  href,
  linkLabel,
}: {
  title: string;
  note: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-ink pb-3">
      <div className="flex items-baseline gap-4">
        <h2 className="font-display text-4xl font-black uppercase leading-none tracking-tight sm:text-5xl">
          {title}
        </h2>
        <span className="font-mono text-[11px] uppercase text-neutral-500">{note}</span>
      </div>
      {href && linkLabel ? (
        <a
          href={href}
          className="nav-link-anim font-mono text-xs font-bold uppercase tracking-wider transition-colors hover:text-forest"
        >
          {linkLabel} ↗
        </a>
      ) : null}
    </div>
  );
}

export default async function VideosPage() {
  const [videos, playlists, interviews, copy] = await Promise.all([
    allVideos(),
    allPlaylists(),
    allInterviews(),
    getVideosPageCopy(),
  ]);

  // Two editorial sections, then the whole catalogue.
  const samsara = videos.filter((v) => v.venue === "Melodi Samsara");
  const samsaraPreview = samsara.slice(0, SAMSARA_PREVIEW);

  return (
    <>
      {/* ---------- Bicara Melodi: the curated short list ---------- */}
      <Reveal>
        <SectionHead
          title={copy.bicaraTitle}
          note={copy.bicaraNote ?? `${interviews.length} episode pilihan`}
          href="/bicara-melodi"
          linkLabel={copy.bicaraLinkLabel}
        />
        <div className="grid grid-cols-1 gap-6 border-b border-ink py-6 sm:grid-cols-2 lg:grid-cols-3">
          {interviews.map((interview) => (
            <article key={interview.slug} className="group">
              <WatchButton
                id={interview.videoId}
                title={`${interview.artist} — ${interview.headline}`}
                className="block aspect-video w-full overflow-hidden border border-ink bg-neutral-900"
              >
                <YoutubeThumb
                  id={interview.videoId}
                  className="editorial-img h-full w-full object-cover"
                />
              </WatchButton>
              <h3 className="mt-3 font-display text-2xl leading-none tracking-tight">
                {interview.artist}
              </h3>
              <p className="mt-1 text-sm font-extrabold uppercase leading-snug tracking-tight transition-colors group-hover:text-forest">
                {interview.headline}
              </p>
            </article>
          ))}
        </div>
      </Reveal>

      {/* ---------- Melodi Samsara: the live sessions ---------- */}
      <Reveal>
        <SectionHead
          title={copy.samsaraTitle}
          note={copy.samsaraNote ?? `${samsara.length} sesi panggung`}
          href={`https://www.youtube.com/@${CHANNEL.handle}/videos`}
          linkLabel={copy.samsaraLinkLabel}
        />
        <div className="divide-y divide-neutral-300 border-b border-ink">
          {samsaraPreview.map((video, i) => (
            <VideoRow key={video.id} video={video} index={i} />
          ))}
        </div>
      </Reveal>

      {/* ---------- Playlists ---------- */}
      <Reveal>
        <div className="flex items-baseline justify-between border-b-2 border-ink pb-3">
          <h2 className="text-3xl tracking-tight sm:text-4xl">{copy.playlistsTitle}</h2>
          <span className="font-mono text-[11px] text-neutral-500">
            {copy.playlistsNote ?? `${playlists.length} playlist publik • ${CHANNEL.handle}`}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 border-b border-ink pb-10 pt-6 sm:grid-cols-2 lg:grid-cols-5">
          {playlists.map((playlist) => (
            <a
              key={playlist.id}
              href={playlist.url}
              target="_blank"
              rel="noreferrer"
              className="brutalist-card group flex flex-col justify-between border border-ink bg-paper p-4"
            >
              <div>
                <span className="font-mono text-[10px] uppercase text-neutral-500">Playlist</span>
                <h3 className="mt-1 text-sm font-bold uppercase transition-colors group-hover:text-forest">
                  {playlist.title}
                </h3>
              </div>
              <p className="mt-4 font-mono text-xs font-bold">{playlist.count}</p>
            </a>
          ))}
        </div>
      </Reveal>

      <VideoModal />
    </>
  );
}
