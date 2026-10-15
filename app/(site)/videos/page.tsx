import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { VideosBrowser } from "@/components/VideosBrowser";
import { VideoModal } from "@/components/VideoModal";
import { CHANNEL } from "@/lib/catalogue";
import { allPlaylists, allVideos } from "@/lib/videos";

export const metadata: Metadata = {
  title: "Videos",
  description:
    "Katalog video Melodi Alam: live session Melodi Samsara dan Melodi Taman, serta wawancara Bicara Melodi.",
};

export default async function VideosPage() {
  // Sanity first, the build-time catalogue behind it.
  const videos = await allVideos();
  const playlists = await allPlaylists();

  return (
    <>
      <Reveal>
        <VideosBrowser videos={videos} />
      </Reveal>

      <Reveal>
        <div className="flex items-baseline justify-between border-b-2 border-ink pb-3">
          <h2 className="text-3xl tracking-tight sm:text-4xl">Playlists</h2>
          <span className="font-mono text-[11px] text-neutral-500">
            {playlists.length} playlist publik • {CHANNEL.handle}
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

        <p className="pt-4 text-xs font-mono text-neutral-500">
          Katalog diambil dari kanal YouTube resmi. Angka views mengikuti tampilan YouTube dan
          diperbarui manual lewat Sanity Studio; umur video dihitung dari tanggal terbitnya.
        </p>
      </Reveal>

      <VideoModal />
    </>
  );
}
