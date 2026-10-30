import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion/Reveal";
import { StoriesGrid } from "@/components/StoriesGrid";
import { pageMetadata } from "@/lib/page-metadata";
import { getSiteSettings } from "@/lib/site-settings";
import { storyPage } from "@/lib/story-pages";

/**
 * Page 2 and on.
 *
 * Page 1 is the shared list of eight; every story that did not fit continues
 * here, so nothing published is reachable only by typing its address. Each page
 * is prerendered: the URL carries the number, not a query string, which keeps
 * the pages static and the canonical honest.
 */
export async function generateStaticParams() {
  const { pages } = await storyPage(1);
  return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ page: String(i + 2) }));
}

export async function generateMetadata(props: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const { page } = await props.params;
  return pageMetadata({
    title: `Stories — halaman ${page}`,
    description:
      "Halaman lanjutan Stories Melodi Alam: esai skena musik, catatan wawancara, dan liputan panggung.",
    path: `/stories/page/${page}`,
    image: "/og-stories.png",
  });
}

export default async function StoriesPaginatedPage(props: {
  params: Promise<{ page: string }>;
}) {
  const { page: raw } = await props.params;
  const page = Number(raw);

  // A page that cannot exist shows the not-found page. It carries `noindex`,
  // and no link points here; the alternative, a redirect, answered 200 with an
  // empty body in this setup, which is worse than either.
  if (!Number.isInteger(page) || page < 2) notFound();

  const [{ articles, pages }, settings] = await Promise.all([storyPage(page), getSiteSettings()]);
  if (page > pages || articles.length === 0) notFound();

  const previous = page === 2 ? "/stories" : `/stories/page/${page - 1}`;
  const next = page < pages ? `/stories/page/${page + 1}` : null;

  return (
    <Reveal>
      <div className="flex items-baseline justify-between pb-4">
        <h1 className="text-4xl tracking-tight sm:text-5xl">Stories</h1>
        <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-600">
          Halaman {page} dari {pages}
        </span>
      </div>

      <StoriesGrid articles={articles} settings={settings} />

      <div className="flex items-center justify-between border-b border-ink py-3 font-mono text-[11px] uppercase tracking-wider">
        <Link
          href={previous}
          className="nav-link-anim font-bold text-ink transition-colors hover:text-forest"
        >
          ← Sebelumnya
        </Link>
        {next ? (
          <Link
            href={next}
            className="nav-link-anim inline-flex min-h-9 items-center py-2 font-bold text-ink transition-colors hover:text-forest"
          >
            Berikutnya →
          </Link>
        ) : (
          <Link
            href="/stories"
            className="nav-link-anim inline-flex min-h-9 items-center py-2 font-bold text-ink transition-colors hover:text-forest"
          >
            Kembali ke halaman 1
          </Link>
        )}
      </div>
    </Reveal>
  );
}
