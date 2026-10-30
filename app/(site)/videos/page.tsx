import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { VideoRow } from "@/components/VideoRow";
import { VideoModal } from "@/components/VideoModal";
import { CHANNEL } from "@/lib/catalogue";
import { SITE } from "@/lib/site";
import { jsonLdScript } from "@/lib/json-ld";
import { pageMetadata } from "@/lib/page-metadata";
import { allPlaylists, allVideos } from "@/lib/videos";
import { getVideosPageCopy } from "@/lib/videos-page";

export const metadata = pageMetadata({
  title: "Melodi Samsara",
  description:
    "Sesi panggung Melodi Samsara di Bogor: live session intim bersama musisi Indonesia, plus playlist resmi Melodi Alam di YouTube.",
  path: "/videos",
  image: "/og-videos.png",
});

/** The live sessions shown before the rest stay on the channel — nine of them. */
const SAMSARA_PREVIEW = 9;

/**
 * Seconds as an ISO 8601 duration, the shape schema.org expects.
 *
 * A video of 13:36 becomes "PT13M36S"; a round minute stays "PT13M", because
 * a zero-seconds suffix is noise.
 */
function isoDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `PT${rest}S`;
  return rest === 0 ? `PT${minutes}M` : `PT${minutes}M${rest}S`;
}

function SectionHead({
  title,
  note,
  href,
  linkLabel,
  level = "h2",
}: {
  title: string;
  note: string;
  href?: string;
  linkLabel?: string;
  /** The first section on the page is the page's own heading. */
  level?: "h1" | "h2";
}) {
  const Heading = level;
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-ink pb-3">
      <div className="flex items-baseline gap-4">
        <Heading className="font-display text-4xl font-black uppercase leading-none tracking-tight sm:text-5xl">
          {title}
        </Heading>
        {/* An empty note is a request to say nothing, not to show an empty gap. */}
        {note ? (
          <span className="font-sans text-[11px] uppercase text-neutral-600">{note}</span>
        ) : null}
      </div>
      {href && linkLabel ? (
        <a
          href={href}
          className="nav-link-anim font-sans text-xs font-bold uppercase tracking-wider transition-colors hover:text-forest"
        >
          {linkLabel}
        </a>
      ) : null}
    </div>
  );
}

export default async function VideosPage() {
  const [videos, playlists, copy] = await Promise.all([
    allVideos(),
    allPlaylists(),
    getVideosPageCopy(),
  ]);

  // Melodi Samsara, the live sessions. The interview episodes live on their own
  // page, so they are not repeated here.
  const samsara = videos.filter((v) => v.venue === "Melodi Samsara");
  const samsaraPreview = samsara.slice(0, SAMSARA_PREVIEW);

  // Structured data for the sessions on this page. The videos live on YouTube,
  // so each entry points at the embed and at this page's anchor rather than
  // pretending there is a page per video.
  const videoJsonLd = jsonLdScript({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: copy.samsaraTitle,
    url: `${SITE.url}/videos`,
    numberOfItems: samsaraPreview.length,
    itemListElement: samsaraPreview.map((video, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "VideoObject",
        "@id": `${SITE.url}/videos#${video.id}`,
        name: video.title,
        description: `${video.venue} — ${video.featuring.join(", ") || "Melodi Alam"}`,
        thumbnailUrl: [`https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`],
        duration: isoDuration(video.seconds),
        embedUrl: `https://www.youtube-nocookie.com/embed/${video.id}`,
        url: `${SITE.url}/videos#${video.id}`,
        publisher: { "@id": `${SITE.url}/#organization` },
      },
    })),
  });

  return (
    <>
      {/* ---------- Melodi Samsara: the live sessions ---------- */}
      <Reveal>
        <SectionHead
          level="h1"
          title={copy.samsaraTitle}
          note={copy.samsaraNote ?? `${samsara.length} sesi panggung`}
          href={`https://www.youtube.com/@${CHANNEL.handle}/videos`}
          linkLabel={copy.samsaraLinkLabel}
        />
        <h2 className="sr-only">Sesi panggung</h2>
        <div className="divide-y divide-neutral-300 border-b border-ink">
          {samsaraPreview.map((video, i) => (
            <VideoRow key={video.id} video={video} index={i} />
          ))}
        </div>

        {/* The rest of the sessions stay on the channel; the site shows a
            selection, not the whole catalogue. */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink py-4">
          <span className="font-sans text-[11px] uppercase tracking-wider text-neutral-600">
            Sesi lainnya ada di kanal YouTube
          </span>
          <a
            href={`https://www.youtube.com/@${CHANNEL.handle}/videos`}
            target="_blank"
            rel="noreferrer"
            className="nav-link-anim font-bold uppercase tracking-wider text-ink transition-colors hover:text-forest"
          >
            YouTube
          </a>
        </div>
      </Reveal>

      {/* ---------- Playlists ---------- */}
      <Reveal>
        <div className="flex items-baseline justify-between border-b-2 border-ink pb-3">
          <h2 className="text-3xl tracking-tight sm:text-4xl">{copy.playlistsTitle}</h2>
          <span className="font-sans text-[11px] text-neutral-600">
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
                <span className="font-sans text-[10px] uppercase text-neutral-600">Playlist</span>
                <h3 className="mt-1 text-sm font-bold uppercase transition-colors group-hover:text-forest">
                  {playlist.title}
                </h3>
              </div>
              <p className="mt-4 font-sans text-xs font-bold">{playlist.count}</p>
            </a>
          ))}
        </div>
      </Reveal>

      {/* ---------- Dari Feed → Discover ---------- */}
      <div className="flex justify-end font-sans text-xs text-neutral-600">
        <Link
          href="/discover"
          className="nav-link-anim font-bold uppercase tracking-wider text-ink transition-colors hover:text-forest"
        >
          Discover
        </Link>
      </div>

      <VideoModal />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: videoJsonLd }} />
    </>
  );
}
