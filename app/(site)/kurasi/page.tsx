import type { Metadata } from "next";
import { KurasiBrowser } from "@/components/KurasiBrowser";
import { Reveal } from "@/components/Reveal";
import { allPillarPosts } from "@/lib/pillars";

export const metadata: Metadata = {
  title: "Curated News",
  description:
    "Curated News: pilihan tim Melodi Alam dari feed Instagram — fakta musik, lirik, trivia, kutipan, rekomendasi melodi, ulas melodi, dan clipper.",
  alternates: { canonical: "/kurasi" },
};

/**
 * The curated pool. The cards render in `KurasiBrowser` because search and the
 * pillar chips are client state; the page itself only reads the pool.
 */
export default async function KurasiPage() {
  const feed = await allPillarPosts();

  return (
    <Reveal>
      <div className="flex items-baseline justify-between pb-4">
        <h2 className="text-4xl tracking-tight sm:text-5xl">Curated News</h2>
        <span className="font-serif text-sm italic text-neutral-600">
          (pilihan tim dari feed @melodi.alam)
        </span>
      </div>

      <KurasiBrowser posts={feed} />
    </Reveal>
  );
}
