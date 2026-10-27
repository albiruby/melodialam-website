import Image from "next/image";
import Link from "next/link";
import { CATEGORY_LABELS, type Article } from "@/lib/content-fallback";
import { COVER_FRAME } from "./ArticleCards";

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
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] uppercase tracking-widest text-neutral-600">
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
</span>
      </div>
    </Link>
  );
}
