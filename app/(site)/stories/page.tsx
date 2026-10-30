import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { StoriesGrid } from "@/components/StoriesGrid";
import { pageMetadata } from "@/lib/page-metadata";
import { getSiteSettings } from "@/lib/site-settings";
import { storyPage } from "@/lib/story-pages";

export const metadata = pageMetadata({
  title: "Stories",
  description:
    "Catatan redaksi Melodi Alam: esai skena musik, rekomendasi melodi, catatan wawancara Bicara Melodi, dan liputan panggung.",
  path: "/stories",
  image: "/og-stories.png",
});

export default async function StoriesPage() {
  const [{ articles, pages }, settings] = await Promise.all([storyPage(1), getSiteSettings()]);

  return (
    <Reveal>
      <h1 className="pb-4 text-4xl tracking-tight sm:text-5xl">Stories</h1>

      <StoriesGrid articles={articles} settings={settings} />

      {pages > 1 ? (
        <div className="flex items-center justify-end border-b border-ink py-3 font-mono text-[11px] uppercase tracking-wider">
          <Link
            href="/stories/page/2"
            className="nav-link-anim inline-flex min-h-9 items-center py-2 font-bold text-ink transition-colors hover:text-forest"
          >
            Halaman 2 →
          </Link>
        </div>
      ) : null}

      {/* ---------- Dari Feed → Discover ---------- */}
      <div className="flex justify-end pt-4 font-mono text-xs text-neutral-600">
        <Link
          href="/discover"
          className="nav-link-anim font-bold uppercase tracking-wider text-ink transition-colors hover:text-forest"
        >
          Discover
        </Link>
      </div>
    </Reveal>
  );
}
