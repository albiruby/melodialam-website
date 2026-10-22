import Image from "next/image";
import { PILLAR_LABELS, pillarDate, type PillarPost } from "@/lib/pillars-shared";

/**
 * Cards for the "Dari Feed" sections — curated Instagram posts.
 *
 * `PillarCard` is the photo-pillar card (4:5 art, Stories side and the home
 * teaser); `PillarRow` is the reel-pillar row (vertical thumb, Videos side).
 * Both open the original post on Instagram — the slides and the video live
 * there.
 */

export function PillarCard({
  post,
  showPillar = false,
}: {
  post: PillarPost;
  /** Name the pillar on the card — useful where cards from several pillars mix. */
  showPillar?: boolean;
}) {
  // One uniform 4:5 frame for every card. The covers are the posts' own 4:5
  // slides, so `object-cover` fills the frame exactly — no crop, no gaps.
  return (
    <a href={post.igUrl} target="_blank" rel="noreferrer" className="group flex flex-col">
      <div className="relative aspect-[4/5] w-full overflow-hidden border border-ink bg-paper">
        {post.image ? (
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 100vw"
            className="object-cover"
          />
        ) : null}
        {post.mediaType === "reel" ? (
          <span className="absolute right-2 top-2 border border-ink bg-white px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase">
            Reel
          </span>
        ) : null}
      </div>
      {showPillar ? (
        <span className="mt-3 font-mono text-[10px] font-bold uppercase tracking-wider text-forest">
          {PILLAR_LABELS[post.pillar] ?? post.pillar}
        </span>
      ) : null}
      <h4
        className={`${showPillar ? "mt-1" : "mt-3"} text-sm font-extrabold uppercase leading-snug tracking-tight transition-colors group-hover:text-forest`}
      >
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
  // The thumb frame follows the image's own ratio, so nothing is cropped.
  const ratio =
    post.imageWidth && post.imageHeight ? `${post.imageWidth} / ${post.imageHeight}` : "9 / 16";

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
      <div
        className="relative h-24 shrink-0 overflow-hidden border border-ink bg-neutral-900 sm:h-28"
        style={{ aspectRatio: ratio }}
      >
        {post.image ? (
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="120px"
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

