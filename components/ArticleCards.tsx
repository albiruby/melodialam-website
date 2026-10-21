import Image from "next/image";
import Link from "next/link";
import { articleReadingTime, CATEGORY_LABELS, type Article } from "@/lib/content";

/**
 * Article cards.
 *
 * Every card is ONE link: the whole card is the target, including the picture
 * and the "Baca Selengkapnya" line. The earlier version put the link on the
 * title and stretched a `::after` over the card — the pseudo-element sat above
 * the artwork but a click on the caption below it did nothing, which is exactly
 * what a reader reported. A real anchor around the card cannot miss.
 *
 * Covers are 4:5 — the ratio an Instagram feed post uses — so the card art is
 * shown whole, caption and all, never cropped into a square or 4:3 frame.
 */

/** One frame for every cover: 4:5, the ratio of a feed post. */
const COVER_FRAME = "aspect-[4/5]";

/**
 * Staggered editorial card used on /stories.
 *
 * `titleFirst` flips the layout so every other column leads with the headline —
 * the alternation that produced the source page's staggered rhythm.
 *
 * The green hover curtain's copy comes from `siteSettings.cardCurtain`, passed
 * down by the page; its teaser prefers the article's own `note` over `excerpt`.
 */
export function ArticleCard({
  article,
  titleFirst = false,
  index = 0,
  readLabel = "READ STORY",
  noteCta = "Buka Catatan Redaksi",
}: {
  article: Article;
  titleFirst?: boolean;
  index?: number;
  readLabel?: string;
  noteCta?: string;
}) {
  return (
    <Link
      href={`/stories/${article.slug}`}
      aria-label={article.title}
      style={{ animationDelay: `${index * 75}ms` }}
      className="stagger-item group -m-2 flex flex-col justify-between p-2 transition-colors duration-300 hover:bg-paper"
    >
      <div>
        {titleFirst ? (
          <>
            <h3 className="mb-4 text-xl font-medium leading-snug transition-colors duration-300 group-hover:text-forest">
              {article.title}
            </h3>
            <CardImage article={article} readLabel={readLabel} noteCta={noteCta} />
            <p className="mb-4 text-xs leading-relaxed text-neutral-600">{article.excerpt}</p>
          </>
        ) : (
          <>
            <CardImage article={article} readLabel={readLabel} noteCta={noteCta} />
            <h3 className="mb-2 text-xl font-medium leading-snug transition-colors duration-300 group-hover:text-forest">
              {article.title}
            </h3>
            <p className="mb-4 text-xs leading-relaxed text-neutral-600">{article.excerpt}</p>
          </>
        )}
      </div>

      <div className="flex justify-between border-t border-neutral-200 pt-2 text-[11px] text-neutral-500">
        <span className="flex items-center gap-2">
          <span className="font-medium text-ink">{CATEGORY_LABELS[article.category]}</span>
          {article.mediaType === "reel" ? (
            <span className="border border-ink px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider">
              Reel
            </span>
          ) : null}
        </span>
        <span className="flex items-center gap-2">
          <span>{articleReadingTime(article)} menit</span>
          <span aria-hidden>•</span>
          <time dateTime={article.dateISO}>{article.date}</time>
        </span>
      </div>
    </Link>
  );
}

function CardImage({
  article,
  readLabel,
  noteCta,
}: {
  article: Article;
  readLabel: string;
  noteCta: string;
}) {
  return (
    <div
      className={`hover-reveal-box corner-frame relative mb-4 ${COVER_FRAME} border border-ink bg-neutral-900`}
    >
      <Image
        src={article.image}
        alt={article.title}
        fill
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        className="editorial-img object-cover"
      />
      <div className="hover-reveal-curtain">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-green-400">
          <span>{CATEGORY_LABELS[article.category]}</span>
          <span>{readLabel}</span>
        </div>
        <p className="hover-reveal-tag line-clamp-3 text-xs leading-relaxed text-neutral-200">
          {article.note ?? article.excerpt}
        </p>
        <div className="hover-reveal-tag flex items-center justify-between border-t border-white/20 pt-2 text-[11px] uppercase">
          <span>{noteCta}</span>
          <span>↗</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Front-page card: the cover on the left, the story on the right.
 *
 * The home page shows the four newest feed-photo stories in a 2×2 grid of
 * these. A single full-width cover story above them made the page open with one
 * enormous picture and pushed everything else below the fold, so the four
 * stories now carry the same weight.
 */
export function FrontCard({ article, lead = false }: { article: Article; lead?: boolean }) {
  return (
    <Link
      href={`/stories/${article.slug}`}
      aria-label={article.title}
      className="group flex gap-4 border-b border-ink py-5 pr-2 transition-colors duration-300 hover:bg-paper sm:gap-5"
    >
      <div
        className={`hover-reveal-box corner-frame relative w-28 shrink-0 overflow-hidden border border-ink bg-neutral-900 sm:w-36 ${COVER_FRAME}`}
      >
        <Image
          src={article.image}
          alt={article.title}
          fill
          sizes="(min-width: 640px) 144px, 112px"
          className="editorial-img object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-col">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] uppercase tracking-widest text-neutral-500">
          {lead ? <span className="bg-forest px-2 py-0.5 text-white">Cover Story</span> : null}
          <span className="font-medium text-ink">{CATEGORY_LABELS[article.category]}</span>
          <span aria-hidden>•</span>
          <time dateTime={article.dateISO}>{article.date}</time>
        </div>

        <h3 className="mt-2 text-lg font-bold leading-snug tracking-tight transition-colors group-hover:text-forest sm:text-xl">
          {article.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-neutral-600 sm:line-clamp-3">
          {article.excerpt}
        </p>

        <span className="mt-auto inline-flex items-center gap-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-ink transition-colors group-hover:text-forest">
          Baca Selengkapnya
          <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">
            ↗
          </span>
        </span>
      </div>
    </Link>
  );
}
