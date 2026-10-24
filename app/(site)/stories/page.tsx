import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { StoriesGrid } from "@/components/StoriesGrid";
import { getSiteSettings } from "@/lib/site-settings";
import { storyPage } from "@/lib/story-pages";

export const metadata: Metadata = {
  title: "Stories",
  description:
    "Catatan redaksi Melodi Alam: esai skena musik, rekomendasi melodi, catatan wawancara Bicara Melodi, dan liputan panggung.",
  alternates: { canonical: "/stories" },
};

export default async function StoriesPage() {
  const [{ articles, pages }, settings] = await Promise.all([storyPage(1), getSiteSettings()]);

  return (
    <Reveal>
      <div className="flex items-baseline justify-between pb-4">
        <h2 className="text-4xl tracking-tight sm:text-5xl">Stories</h2>
        <span className="font-serif text-sm italic text-neutral-600">
          ({settings.curationNote})
        </span>
      </div>

      <StoriesGrid articles={articles} settings={settings} />

      {pages > 1 ? (
        <div className="flex items-center justify-end border-b border-ink py-3 font-mono text-[11px] uppercase tracking-wider">
          <Link
            href="/stories/page/2"
            className="nav-link-anim font-bold text-ink transition-colors hover:text-forest"
          >
            Halaman 2 →
          </Link>
        </div>
      ) : null}

      {/* ---------- Dari Feed → Curated News ---------- */}
      <div className="flex items-center justify-between pt-4 font-mono text-xs text-neutral-500">
        <span>Konten kurasi dari feed @melodi.alam</span>
        <Link
          href="/kurasi"
          className="nav-link-anim font-bold uppercase tracking-wider text-ink transition-colors hover:text-forest"
        >
          Curated News ↗
        </Link>
      </div>
    </Reveal>
  );
}
