import Image from "next/image";
import Link from "next/link";
import { articleReadingTime, type Article } from "@/lib/content";
import { ParallaxImage } from "./motion/ParallaxImage";

/**
 * Staggered editorial card used on /journal and /.
 *
 * `titleFirst` flips the layout so every other column leads with the headline —
 * the alternation that produced the source page's staggered rhythm.
 */
export function ArticleCard({
  article,
  titleFirst = false,
  index = 0,
}: {
  article: Article;
  titleFirst?: boolean;
  index?: number;
}) {
  return (
    <article
      style={{ animationDelay: `${index * 75}ms` }}
      className="stagger-item group -m-2 flex cursor-pointer flex-col justify-between p-2 transition-colors duration-300 hover:bg-paper"
    >
      <div>
        {titleFirst ? (
          <>
            <h3 className="mb-4 text-xl font-medium leading-snug transition-colors duration-300 group-hover:text-forest">
              <Link href={`/journal/${article.slug}`} className="after:absolute after:inset-0">
                {article.title}
              </Link>
            </h3>
            <CardImage article={article} ratio="4/3" />
            <p className="mb-4 text-xs leading-relaxed text-neutral-600">{article.excerpt}</p>
          </>
        ) : (
          <>
            <CardImage article={article} ratio="square" />
            <h3 className="mb-2 text-xl font-medium leading-snug transition-colors duration-300 group-hover:text-forest">
              <Link href={`/journal/${article.slug}`} className="after:absolute after:inset-0">
                {article.title}
              </Link>
            </h3>
            <p className="mb-4 text-xs leading-relaxed text-neutral-600">{article.excerpt}</p>
          </>
        )}
      </div>

      <div className="flex justify-between border-t border-neutral-200 pt-2 text-[11px] text-neutral-500">
        <span className="font-medium text-ink">{article.category}</span>
        <span className="flex items-center gap-2">
          <span>{articleReadingTime(article)} menit</span>
          <span aria-hidden>•</span>
          <time dateTime={article.dateISO}>{article.date}</time>
        </span>
      </div>
    </article>
  );
}

/**
 * Both shapes must appear as complete literals in this file. An interpolated
 * `aspect-[${ratio}]` never matches Tailwind's scanner, and `aspect-[square]`
 * is not a valid value either — so the frame came out with no aspect ratio at
 * all and collapsed to zero height, which next/image reported as "fill and a
 * height value of 0".
 */
const FRAME_SHAPE = {
  square: "aspect-square",
  "4/3": "aspect-[4/3]",
} as const;

function CardImage({ article, ratio }: { article: Article; ratio: "4/3" | "square" }) {
  return (
    <div
      className={`hover-reveal-box corner-frame mb-4 ${FRAME_SHAPE[ratio]} border border-ink bg-neutral-900`}
    >
      <Image
        src={article.image}
        alt={article.title}
        fill
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        className="editorial-img object-cover grayscale transition-[filter] duration-600 group-hover:grayscale-0"
      />
      <div className="hover-reveal-curtain">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-green-400">
          <span>{article.category}</span>
          <span>READ STORY</span>
        </div>
        <p className="hover-reveal-tag line-clamp-3 text-xs leading-relaxed text-neutral-200">
          {article.excerpt}
        </p>
        <div className="hover-reveal-tag flex items-center justify-between border-t border-white/20 pt-2 text-[11px] uppercase">
          <span>Buka Catatan Redaksi</span>
          <span>↗</span>
        </div>
      </div>
    </div>
  );
}

/** Large hero card for the cover story. */
export function HeroArticle({ article }: { article: Article }) {
  return (
    <article className="group relative overflow-hidden border-b border-ink">
      <ParallaxImage
        src={article.image}
        alt={article.title}
        className="aspect-[16/10] w-full bg-neutral-900 sm:aspect-[21/9]"
        imageClassName="object-cover opacity-85"
        sizes="(min-width: 1360px) 1328px, 100vw"
        distance={64}
        preload
      />
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/35 to-transparent p-5 text-white sm:p-10">
        <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-widest text-neutral-300">
          <span className="bg-forest px-2 py-0.5 text-white">COVER STORY</span>
          <span>•</span>
          <span>{article.category.toUpperCase()}</span>
        </div>
        <h2 className="max-w-3xl text-2xl font-bold leading-[1.08] tracking-tight transition-transform duration-500 group-hover:translate-x-1.5 sm:text-4xl lg:text-5xl">
          <Link href={`/journal/${article.slug}`} className="after:absolute after:inset-0">
            {article.title}
          </Link>
        </h2>
        <p className="mt-3 line-clamp-2 max-w-2xl text-xs text-neutral-200 opacity-90 transition-opacity group-hover:opacity-100 sm:text-sm">
          {article.excerpt}
        </p>
        <div className="mt-4 flex items-center gap-4 text-[11px] uppercase tracking-wider text-neutral-300">
          <span>Oleh Tim Redaksi Melodi Alam</span>
          <span>•</span>
          <span className="inline-flex items-center gap-1 transition-colors group-hover:text-green-400">
            Baca Selengkapnya{" "}
            <span className="inline-block transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-1">
              ↗
            </span>
          </span>
        </div>
      </div>
    </article>
  );
}

/** Compact card used in the three-column grid under the hero. */
export function FeatureCard({ article, note }: { article: Article; note: string }) {
  return (
    <article className="group flex cursor-pointer flex-col justify-between p-4 transition-colors duration-300 hover:bg-paper sm:p-5">
      <div>
        <div className="hover-reveal-box corner-frame mb-3 aspect-[16/10] border border-ink bg-neutral-900">
          <Image
            src={article.image}
            alt={article.title}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="editorial-img object-cover grayscale transition-[filter] duration-600 group-hover:grayscale-0"
          />
          <div className="hover-reveal-curtain">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-green-400">
              <span>{article.category.toUpperCase()}</span>
              <span>{note}</span>
            </div>
            <p className="hover-reveal-tag line-clamp-3 text-xs leading-relaxed text-neutral-200">
              {article.excerpt}
            </p>
            <div className="hover-reveal-tag flex items-center justify-between border-t border-white/20 pt-2 text-[11px] uppercase">
              <span>Baca Artikel Penuh</span>
              <span>↗</span>
            </div>
          </div>
        </div>
        <h3 className="text-base font-bold leading-snug transition-colors group-hover:text-forest sm:text-lg">
          <Link href={`/journal/${article.slug}`} className="after:absolute after:inset-0">
            {article.title}
          </Link>
        </h3>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-neutral-200 pt-2 text-[11px] text-neutral-500">
        <time dateTime={article.dateISO}>{article.date}</time>
        <span className="font-medium text-ink transition-transform group-hover:translate-x-1">
          {article.category} ↗
        </span>
      </div>
    </article>
  );
}