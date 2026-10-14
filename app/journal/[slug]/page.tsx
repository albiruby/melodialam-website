import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES, ARTICLES as ALL, CATEGORY_LABELS } from "@/lib/content";
import { ArticleCard } from "@/components/ArticleCards";

export function generateStaticParams() {
  return ALL.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata(props: PageProps<"/journal/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const article = ALL.find((a) => a.slug === slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [{ url: article.image }],
      type: "article",
    },
  };
}

export default async function ArticlePage(props: PageProps<"/journal/[slug]">) {
  const { slug } = await props.params;
  const article = ALL.find((a) => a.slug === slug);
  if (!article) notFound();

  const related = ALL.filter(
    (a) => a.slug !== article.slug && a.category === article.category,
  ).slice(0, 3);

  const fallbacks = related.length
    ? related
    : ALL.filter((a) => a.slug !== article.slug).slice(0, 3);

  return (
    <article>
      {/* Header */}
      <header className="border-b border-ink pb-6">
        <Link
          href="/journal"
          className="nav-link-anim font-mono text-[11px] uppercase tracking-widest transition-colors hover:text-forest"
        >
          ← Kembali ke Journal
        </Link>

        <div className="mt-4 flex items-center gap-3 text-[11px] uppercase tracking-widest text-neutral-500">
          <span className="bg-forest px-2 py-0.5 text-white">{article.category}</span>
          <time dateTime={article.dateISO}>{article.date}</time>
        </div>

        <h1 className="mt-4 max-w-5xl text-3xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
          {article.title}
        </h1>

        <p className="mt-4 max-w-3xl font-serif text-lg italic leading-snug text-neutral-700 sm:text-xl">
          {article.excerpt}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-neutral-200 pt-4 text-[11px] font-mono text-neutral-500">
          <span>SUMBER: REDAKSI MELODI ALAM (@MELODI.ALAM)</span>
          <span>•</span>
          <span className="font-medium text-ink">{CATEGORY_LABELS[article.category]}</span>
        </div>
      </header>

      {/* Cover */}
      <div className="my-8 aspect-[16/9] w-full overflow-hidden border border-ink bg-neutral-200">
        <Image
          src={article.image}
          alt={article.title}
          fill
          priority
          sizes="(min-width: 1360px) 1328px, 100vw"
          className="object-cover"
        />
      </div>

      {/* Body */}
      <div className="mx-auto max-w-2xl space-y-5">
        {article.body.map((paragraph, i) => (
          <p
            key={i}
            className={`text-base leading-relaxed text-neutral-800 ${
              i === 0 ? "first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-6xl first-letter:leading-[0.85] first-letter:text-forest" : ""
            }`}
          >
            {paragraph}
          </p>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-ink pt-4 text-xs font-mono">
        <span>
          {ARTICLES.length} artikel di journal • kurasi redaksi
        </span>
        <a
          href="https://www.instagram.com/melodi.alam/?hl=en"
          target="_blank"
          rel="noreferrer"
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
            href="/journal"
            className="nav-link-anim text-xs font-bold uppercase tracking-wider transition-colors hover:text-forest"
          >
            Semua Artikel ↗
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-8 pt-8 sm:grid-cols-2 lg:grid-cols-3">
          {fallbacks.map((a, i) => (
            <div key={a.slug} className="relative">
              <ArticleCard article={a} index={i} />
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}