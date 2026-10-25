import Image from "next/image";
import { PILLAR_LABELS, pillarDate, type PillarPost } from "@/lib/pillars-shared";

/**
 * Cards for the "Dari Feed" sections — curated Instagram posts, photo and reel
 * alike. Both kinds render as the same card: one uniform 4:5 frame with the
 * post's cover, the title, and a bottom row where the date and "Buka di IG"
 * sit on one line.
 *
 * The card is `h-full` with `mt-auto` on that bottom row so cards in the same
 * grid line up even when one title is two lines and another is five — the
 * caption does not push the date row to different heights.
 *
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
    <a href={post.igUrl} target="_blank" rel="noreferrer" className="group flex h-full flex-col">
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
      <div className="mt-auto flex items-center justify-between gap-2 pt-2 font-mono text-[10px] uppercase text-neutral-500">
        <span>{pillarDate(post.date)}</span>
        <span className="transition-colors group-hover:text-forest">Buka di IG</span>
      </div>
    </a>
  );
}

