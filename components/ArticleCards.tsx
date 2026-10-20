import Image from "next/image";
import Link from "next/link";
import { articleReadingTime, CATEGORY_LABELS, type Article } from "@/lib/content";
import { ParallaxImage } from "./motion/ParallaxImage";

/**
 * Staggered editorial card used on /journal and /.
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
            <CardImage article={article} readLabel={readLabel} noteCta={noteCta} />
            <p className="mb-4 text-xs leading-relaxed text-neutral-600">{article.excerpt}</p>
          </>
        ) : (
          <>
            <CardImage article={article} readLabel={readLabel} noteCta={noteCta} />
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
        <span className="font-medium text-ink">{CATEGORY_LABELS[article.category]}</span>
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
 * One frame for every cover: 4:5, the ratio an Instagram feed post uses.
 *
 * The covers are the posts' own slides, so the frame matches the art exactly
 * and `object-cover` fills it without cutting a single line of the caption
 * baked into the card. The class has to be a complete literal — an
 * interpolated `aspect-[${ratio}]` never matches Tailwind's scanner, and
 * `aspect-[square]` is not a valid value either, so the frame came out with
 * no aspect ratio at all and collapsed to zero height.
 */
const COVER_FRAME = "aspect-[4/5]";

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
      className={`hover-reveal-box corner-frame mb-4 ${COVER_FRAME} border border-ink bg-neutral-900`}
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
 * Cover story for the top of the home page.
 *
 * The art is 4:5 — the frame an Instagram feed post uses — so the cover drops
 * in without being re-cropped and the caption baked into the card stays
 * readable. On wide screens the caption sits beside the image; on phones it
 * stacks under it.
 */
export function HeroArticle({ article }: { article: Article }) {
  return (
    <article className="group relative border-b border-ink">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <ParallaxImage
            src={article.image}
            alt={article.title}
            className="aspect-[4/5] w-full bg-neutral-900"
            imageClassName="object-cover"
            sizes="(min-width: 1024px) 550px, 100vw"
            distance={48}
            preload
          />
        </div>

        <div className="flex flex-col justify-center gap-3 border-t border-ink p-5 lg:col-span-7 lg:border-l lg:border-t-0 lg:p-8">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-neutral-500">
            <span className="bg-forest px-2 py-0.5 text-white">COVER STORY</span>
            <span aria-hidden>•</span>
            <span>{CATEGORY_LABELS[article.category].toUpperCase()}</span>
          </div>
          <h2 className="text-2xl font-bold leading-[1.08] tracking-tight transition-transform duration-500 group-hover:translate-x-1.5 sm:text-3xl lg:text-4xl">
            <Link href={`/journal/${article.slug}`} className="after:absolute after:inset-0">
              {article.title}
            </Link>
          </h2>
          <p className="line-clamp-3 text-xs leading-relaxed text-neutral-600 sm:text-sm">
            {article.excerpt}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] uppercase tracking-wider text-neutral-500">
            <span>Oleh Tim Redaksi Melodi Alam</span>
            <span aria-hidden>•</span>
            <span className="inline-flex items-center gap-1 transition-colors group-hover:text-forest">
              Baca Selengkapnya{" "}
              <span className="inline-block transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-1">
                ↗
              </span>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Compact card used in the three-column grid under the hero. Same green curtain
 * as `ArticleCard`; `note` and `ctaLabel` come from `siteSettings.cardCurtain`.
 */
export function FeatureCard({
  article,
  note,
  ctaLabel = "Baca Artikel Penuh",
}: {
  article: Article;
  note: string;
  ctaLabel?: string;
}) {
  return (
    <article className="group flex cursor-pointer flex-col justify-between p-4 transition-colors duration-300 hover:bg-paper sm:p-5">
      <div>
        <div className="hover-reveal-box corner-frame mb-3 aspect-[4/5] border border-ink bg-neutral-900">
          <Image
            src={article.image}
            alt={article.title}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="editorial-img object-cover"
          />
          <div className="hover-reveal-curtain">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-green-400">
              <span>{CATEGORY_LABELS[article.category].toUpperCase()}</span>
              <span>{note}</span>
            </div>
            <p className="hover-reveal-tag line-clamp-3 text-xs leading-relaxed text-neutral-200">
              {article.note ?? article.excerpt}
            </p>
            <div className="hover-reveal-tag flex items-center justify-between border-t border-white/20 pt-2 text-[11px] uppercase">
              <span>{ctaLabel}</span>
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
          {CATEGORY_LABELS[article.category]} ↗
        </span>
      </div>
    </article>
  );
}