import Image from "next/image";
import { PILLAR_LABELS, pillarDate, type PillarPost } from "@/lib/pillars-shared";

/**
 * Cards for the curated feed.
 *
 * One uniform 4:5 frame, a title, and one metadata line. The card is `h-full`
 * with `mt-auto` on the metadata row so cards in the same grid line up even
 * when one title is two lines and another is five.
 *
 * `horizontalOnMobile` turns the card into an image-left row below `lg`, then
 * returns it to the vertical card on desktop. `showCta` is false on the front
 * page, where the whole card is already the action; the /discover page keeps
 * the explicit "Buka di IG" line.
 */
export function PillarCard({
  post,
  showPillar = false,
  horizontalOnMobile = false,
  showCta = true,
  eager = false,
}: {
  post: PillarPost;
  /** Name the pillar on the card — useful where cards from several pillars mix. */
  showPillar?: boolean;
  /** Image left / text right below `lg`, vertical from `lg` up. */
  horizontalOnMobile?: boolean;
  /** Show the explicit "Buka di IG" line. */
  showCta?: boolean;
  /** Fetch immediately at low priority — the home-page feed images. */
  eager?: boolean;
}) {
  return (
    <a
      href={post.igUrl}
      target="_blank"
      rel="noreferrer"
      className={`group flex h-full gap-4 ${
        horizontalOnMobile ? "lg:flex-col lg:gap-0" : "flex-col"
      }`}
    >
      <div
        className={`relative aspect-[4/5] shrink-0 overflow-hidden bg-neutral-100 ${
          horizontalOnMobile ? "w-24 sm:w-28 lg:w-full" : "w-full"
        }`}
      >
        {post.image ? (
          <>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-wider text-neutral-500"
            >
              Memuat
            </span>
            <Image
              src={post.image}
              alt=""
              fill
              loading={eager ? "eager" : "lazy"}
              fetchPriority={eager ? "low" : "auto"}
              sizes={
                horizontalOnMobile
                  ? "(min-width: 1024px) 33vw, (min-width: 640px) 112px, 96px"
                  : "(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 100vw"
              }
              className="editorial-img object-cover"
            />
          </>
        ) : null}
        {post.mediaType === "reel" ? (
          <span className="absolute right-2 top-2 bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-ink">
            Reel
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {showPillar ? (
          <span className="mt-3 font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            {PILLAR_LABELS[post.pillar] ?? post.pillar}
          </span>
        ) : null}
        <h3
          className={`${showPillar ? "mt-2" : "mt-3"} line-clamp-3 text-sm font-extrabold leading-snug tracking-tight text-ink transition-colors group-hover:text-forest`}
        >
          {post.title}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 font-mono text-[10px] uppercase text-neutral-500">
          <span>{pillarDate(post.date)}</span>
          {showCta ? (
            <span className="transition-colors group-hover:text-forest">Buka di IG</span>
          ) : null}
        </div>
      </div>
    </a>
  );
}

/**
 * The lead post in the curated section.
 *
 * Same 4:5 cover as every other card, but it takes six columns on desktop and
 * puts the title underneath. Below `lg` it becomes an image-left row, so the
 * IG cover stays 4:5 without turning a phone or tablet into one enormous
 * portrait.
 */
export function PillarFeature({
  post,
  eager = false,
}: {
  post: PillarPost;
  /** Fetch immediately at low priority — the home-page feed feature. */
  eager?: boolean;
}) {
  return (
    <a
      href={post.igUrl}
      target="_blank"
      rel="noreferrer"
      className="group flex h-full gap-4 lg:flex-col lg:gap-0"
    >
      <div className="relative aspect-[4/5] w-28 shrink-0 overflow-hidden bg-neutral-100 sm:w-32 lg:w-full">
        {post.image ? (
          <>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-wider text-neutral-500"
            >
              Memuat
            </span>
            <Image
              src={post.image}
              alt=""
              fill
              loading={eager ? "eager" : "lazy"}
              fetchPriority={eager ? "low" : "auto"}
              sizes="(min-width: 1024px) 66vw, (min-width: 640px) 128px, 112px"
              className="editorial-img object-cover"
            />
          </>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col lg:mt-3 lg:flex-none">
        <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-wider text-neutral-500">
          <span className="font-bold">{PILLAR_LABELS[post.pillar] ?? post.pillar}</span>
          <span>{pillarDate(post.date)}</span>
        </div>

        <h3 className="mt-2 line-clamp-3 font-display text-xl font-black leading-[1.05] tracking-tight text-ink transition-colors group-hover:text-forest sm:text-2xl lg:text-3xl">
          {post.title}
        </h3>
      </div>
    </a>
  );
}
