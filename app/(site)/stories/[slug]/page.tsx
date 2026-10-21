import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORY_LABELS, articleReadingTime } from "@/lib/content";
import { articleBySlug, latestStories, staticArticleSlugs } from "@/lib/articles";
import { SITE } from "@/lib/site";
import { getSiteSettings } from "@/lib/site-settings";
import { ArticleBody } from "@/components/ArticleBody";
import { ArticleCard } from "@/components/ArticleCards";

/**
 * The twelve articles in `lib/content.ts` are prerendered here. Articles that
 * live only in Sanity are rendered on demand — `dynamicParams` defaults to
 * true, so publishing in the Studio shows up at /stories/<slug> without a
 * rebuild and without touching this list.
 */
export function generateStaticParams() {
  return staticArticleSlugs().map((slug) => ({ slug }));
}

/**
 * This route's entire content is the URL's slug, so there is no
 * params-independent shell to serve and Next.js flags the `await props.params`
 * below as blocking. It is: the page is prerendered per slug, and there is no
 * useful fallback to stream in ahead of it. Declaring that honestly opts the
 * segment out of the instant-navigation check instead of leaving a dev-overlay
 * warning that can never be satisfied.
 */
export const instant = false;

export async function generateMetadata(props: PageProps<"/stories/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const article = await articleBySlug(slug);
  if (!article) return {};

  const path = `/stories/${article.slug}`;

  return {
    title: article.title,
    description: article.excerpt,
    // Without this a preview deployment canonicalises to whatever host served
    // it, which splits the article's signal across two origins.
    alternates: { canonical: path },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      // The image comes from `opengraph-image.tsx` next to this page: a 1200×630
      // card. Pointing at the 4:5 cover here would only hand the timeline a
      // crop of it.
      type: "article",
      publishedTime: article.dateISO,
      url: path,
    },
  };
}

export default async function ArticlePage(props: PageProps<"/stories/[slug]">) {
  const { slug } = await props.params;
  const article = await articleBySlug(slug);
  if (!article) notFound();

  // Same desk first, then topped up from the rest of the journal, so a category
  // with only one other article still fills the three-column grid. Only feed
  // photos are offered — the sections carry feed photos only.
  const [every, settings] = await Promise.all([latestStories(8), getSiteSettings()]);
  const sameDesk = every.filter((a) => a.slug !== article.slug && a.category === article.category);
  const otherDesks = every.filter((a) => a.slug !== article.slug && a.category !== article.category);
  const fallbacks = [...sameDesk, ...otherDesks].slice(0, 3);

  const readMinutes = articleReadingTime(article);

  const url = `${SITE.url}/stories/${article.slug}`;

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: article.title,
        description: article.excerpt,
        image: [article.image.startsWith("http") ? article.image : `${SITE.url}${article.image}`],
        datePublished: article.dateISO,
        articleSection: CATEGORY_LABELS[article.category],
        author: { "@type": "Organization", name: "Tim Redaksi Melodi Alam" },
        publisher: {
          "@type": "Organization",
          name: SITE.name,
          logo: { "@type": "ImageObject", url: `${SITE.url}/icon.png` },
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Latest News", item: SITE.url },
          { "@type": "ListItem", position: 2, name: "Stories", item: `${SITE.url}/stories` },
          { "@type": "ListItem", position: 3, name: article.title, item: url },
        ],
      },
    ],
    // `<` is escaped so the payload can never terminate the script element early.
  }).replace(/</g, "\\u003c");

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      {/* Header */}
      <header className="border-b border-ink pb-6">
        <Link
          href="/stories"
          className="nav-link-anim font-mono text-[11px] uppercase tracking-widest transition-colors hover:text-forest"
        >
          ← Kembali ke Stories
        </Link>

        <div className="mt-4 flex items-center gap-3 text-[11px] uppercase tracking-widest text-neutral-500">
          <span className="bg-forest px-2 py-0.5 text-white">{CATEGORY_LABELS[article.category]}</span>
          <time dateTime={article.dateISO}>{article.date}</time>
          <span aria-hidden>•</span>
          <span>{readMinutes} menit baca</span>
        </div>

        <h1 className="mt-4 max-w-5xl text-3xl font-bold leading-[1.1] tracking-tight text-balance sm:text-5xl lg:text-6xl">
          {article.title}
        </h1>

        <p className="mt-4 max-w-3xl font-serif text-lg italic leading-snug text-neutral-700 sm:text-xl">
          {article.excerpt}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-neutral-200 pt-4 text-[11px] font-mono text-neutral-500">
          <span>SUMBER: REDAKSI MELODI ALAM (@MELODI.ALAM)</span>
          <span aria-hidden>•</span>
          <span className="font-medium text-ink">{CATEGORY_LABELS[article.category]}</span>
          {article.source === "cms" ? (
            <>
              <span aria-hidden>•</span>
              <span className="text-forest">dari CMS</span>
            </>
          ) : null}
        </div>
      </header>

      {/* Cover */}
      {/*
        `relative` is load-bearing: the Image below uses `fill`, whose
        `absolute inset-0` resolves against the nearest positioned ancestor.
        Without it the cover stretched to the viewport instead of the frame,
        leaving most of the frame showing its own grey background.

        The frame is 4:5 — the ratio an Instagram feed post uses — so the cover
        is the card itself, whole, with its own caption readable. It is
        centred and width-capped so the portrait does not run the full width of
        the article column.
      */}
      <div className="relative mx-auto my-8 aspect-[4/5] w-full max-w-md overflow-hidden border border-ink bg-neutral-200">
        <Image
          src={article.image}
          alt={article.title}
          fill
          preload
          sizes="(min-width: 448px) 448px, 100vw"
          className="object-cover"
        />
      </div>

      {/* Body */}
      <ArticleBody rich={article.richBody} paragraphs={article.body} />

      {/* Footer */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-ink pt-4 text-xs font-mono">
        <span>{every.length} artikel di journal • kurasi redaksi</span>
        <a
          href="https://www.instagram.com/melodi.alam/?hl=en"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold underline hover:text-forest"
        >
          Diskusi di Instagram ↗
        </a>
      </div>

      {/* More from the same desk */}
      <section className="mt-16">
        <div className="flex items-baseline justify-between border-b-2 border-ink pb-3">
          <h2 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">
            More {CATEGORY_LABELS[article.category]}
          </h2>
          <Link
            href="/stories"
            className="nav-link-anim text-xs font-bold uppercase tracking-wider transition-colors hover:text-forest"
          >
            Semua Artikel ↗
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-8 pt-8 sm:grid-cols-2 lg:grid-cols-3">
          {fallbacks.map((a, i) => (
            <div key={a.slug} className="relative">
              <ArticleCard
                article={a}
                index={i}
                readLabel={settings.cardCurtain.articleLabel}
                noteCta={settings.cardCurtain.articleCta}
              />
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
