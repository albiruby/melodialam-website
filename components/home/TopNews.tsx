import Image from "next/image";
import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/content-fallback";
import type { SiteArticle } from "@/lib/articles";
import { SectionBar } from "./SectionBar";

/**
 * The news-first front page.
 *
 * The lead story owns the h1 and the largest picture. A "Latest" column carries
 * the next three headlines, then a three-card "More Top News" row. There is no
 * brand hero above this: the first thing a reader meets is the news.
 *
 * The lead is a single link around the headline, deck and photograph, so the
 * whole package is one target. Companion cards are links too; none of them
 * repeats a per-card CTA.
 */
export function TopNews({
  lead,
  sidebar,
  more,
}: {
  lead: SiteArticle | null;
  sidebar: SiteArticle[];
  more: SiteArticle[];
}) {
  if (!lead) return null;

  return (
    <section aria-labelledby="top-news-title">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
        <span>Top News</span>
        <time dateTime={lead.dateISO}>{lead.date}</time>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:gap-10">
        <Link
          href={`/stories/${lead.slug}`}
          target="_blank"
          rel="noreferrer"
          className={`group block ${sidebar.length > 0 ? "lg:col-span-8" : "lg:col-span-12"}`}
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-neutral-500">
            <span className="font-bold text-ink">{CATEGORY_LABELS[lead.category]}</span>
            <span aria-hidden>·</span>
            <time dateTime={lead.dateISO}>{lead.date}</time>
          </div>

          <h1
            id="top-news-title"
            className="mt-3 max-w-4xl text-balance font-display text-[clamp(2.5rem,4.6vw,4.5rem)] font-black leading-[0.95] tracking-[-0.035em] text-ink transition-colors group-hover:text-forest"
          >
            {lead.title}
          </h1>

          <p className="mt-4 line-clamp-2 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            {lead.excerpt}
          </p>

          <div className="relative mt-6 aspect-[3/2] w-full overflow-hidden bg-neutral-900">
            <Image
              src={lead.image}
              alt=""
              fill
              preload
              sizes="(min-width: 1360px) 907px, (min-width: 1024px) 66vw, 100vw"
              className="editorial-img object-cover"
            />
          </div>
        </Link>

        {sidebar.length > 0 ? (
          <aside className="lg:col-span-4">
            <h2 className="pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink">
              Latest
            </h2>

            <SidebarLead article={sidebar[0]} />
            {sidebar.slice(1).map((article) => (
              <SidebarItem key={article.slug} article={article} />
            ))}
          </aside>
        ) : null}
      </div>

      {more.length > 0 ? (
        <div className="mt-12">
          <SectionBar
            label="More Top News"
            href="/stories"
            linkLabel="Semua berita"
          />
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {more.map((article) => (
              <NewsCard key={article.slug} article={article} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SidebarLead({ article }: { article: SiteArticle }) {
  return (
    <Link href={`/stories/${article.slug}`} target="_blank" rel="noreferrer" className="group flex gap-4 pt-4 lg:block">
      <div className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden bg-neutral-900 sm:w-28 lg:w-full">
        <Image
          src={article.image}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 112px, 96px"
          className="editorial-img object-cover"
        />
      </div>
      <div className="min-w-0 flex-1 lg:mt-3 lg:flex-none">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-neutral-500">
          <span className="font-bold text-ink">{CATEGORY_LABELS[article.category]}</span>
          <span aria-hidden>·</span>
          <time dateTime={article.dateISO}>{article.date}</time>
        </div>
        <h3 className="mt-2 line-clamp-3 text-xl font-bold leading-snug tracking-tight text-ink transition-colors group-hover:text-forest">
          {article.title}
        </h3>
      </div>
    </Link>
  );
}

function SidebarItem({ article }: { article: SiteArticle }) {
  return (
    <Link
      href={`/stories/${article.slug}`}
      target="_blank"
      rel="noreferrer"
      className="group block py-4"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-neutral-500">
        <span className="font-bold text-ink">{CATEGORY_LABELS[article.category]}</span>
        <span aria-hidden>·</span>
        <time dateTime={article.dateISO}>{article.date}</time>
      </div>
      <h3 className="mt-2 line-clamp-2 text-base font-bold leading-snug tracking-tight text-ink transition-colors group-hover:text-forest">
        {article.title}
      </h3>
    </Link>
  );
}

function NewsCard({ article }: { article: SiteArticle }) {
  return (
    <Link
      href={`/stories/${article.slug}`}
      target="_blank"
      rel="noreferrer"
      className="group flex gap-4 md:flex-col md:gap-0"
    >
      <div className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden bg-neutral-900 md:w-full">
        <Image
          src={article.image}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 45vw, 96px"
          className="editorial-img object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-col md:mt-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-neutral-500">
          <span className="font-bold text-ink">{CATEGORY_LABELS[article.category]}</span>
          <span aria-hidden>·</span>
          <time dateTime={article.dateISO}>{article.date}</time>
        </div>
        <h3 className="mt-2 line-clamp-3 text-lg font-bold leading-snug tracking-tight text-ink transition-colors group-hover:text-forest md:text-xl">
          {article.title}
        </h3>
      </div>
    </Link>
  );
}
