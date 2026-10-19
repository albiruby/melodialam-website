import Image from "next/image";
import { pillarDate, type PillarPost } from "@/lib/pillars";

/**
 * Cards for the "Dari Feed" sections — curated Instagram posts.
 *
 * `PillarCard` is the photo-pillar card (square art, Stories side);
 * `PillarRow` is the reel-pillar row (vertical thumb, Videos side). Both open
 * the original post on Instagram — the slides and the video live there.
 */

export function PillarCard({ post }: { post: PillarPost }) {
  return (
    <a href={post.igUrl} target="_blank" rel="noreferrer" className="group flex flex-col">
      <div className="relative aspect-square w-full overflow-hidden border border-ink bg-neutral-900">
        {post.image ? (
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
            className="editorial-img object-cover"
          />
        ) : null}
        {post.mediaType === "reel" ? (
          <span className="absolute right-2 top-2 border border-ink bg-white px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase">
            Reel
          </span>
        ) : null}
      </div>
      <h4 className="mt-3 text-sm font-extrabold uppercase leading-snug tracking-tight transition-colors group-hover:text-forest">
        {post.title}
      </h4>
      <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] uppercase text-neutral-500">
        <span>{pillarDate(post.date)}</span>
        <span className="transition-colors group-hover:text-forest">Buka di IG ↗</span>
      </div>
    </a>
  );
}

export function PillarRow({ post, index }: { post: PillarPost; index: number }) {
  return (
    <a
      href={post.igUrl}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-5 px-3 py-4 transition-all duration-300 hover:bg-paper"
    >
      <span className="text-outline-muted w-8 shrink-0 font-mono text-2xl font-bold">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="relative h-24 w-16 shrink-0 overflow-hidden border border-ink bg-neutral-900 sm:h-28 sm:w-20">
        {post.image ? (
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="80px"
            className="editorial-img object-cover"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[10px] uppercase text-neutral-500">
          Dari Feed • {pillarDate(post.date)}
        </div>
        <h4 className="mt-0.5 text-sm font-extrabold uppercase leading-snug tracking-tight transition-colors group-hover:text-forest">
          {post.title}
        </h4>
      </div>
      <span className="shrink-0 font-mono text-xs font-bold uppercase tracking-wider transition-colors group-hover:text-forest">
        IG ↗
      </span>
    </a>
  );
}

/** Section head shared by both pages' "Dari Feed" pillar bands. */
export function PillarHead({ label, note }: { label: string; note: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-ink pb-3">
      <div className="flex items-baseline gap-4">
        <h3 className="font-display text-3xl font-black uppercase leading-none tracking-tight sm:text-4xl">
          {label}
        </h3>
        <span className="font-mono text-[11px] uppercase text-neutral-500">{note}</span>
      </div>
      <a
        href="https://www.instagram.com/melodi.alam/"
        target="_blank"
        rel="noreferrer"
        className="nav-link-anim font-mono text-xs font-bold uppercase tracking-wider transition-colors hover:text-forest"
      >
        @melodi.alam ↗
      </a>
    </div>
  );
}
