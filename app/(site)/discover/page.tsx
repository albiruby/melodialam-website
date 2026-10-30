import { DiscoverBrowser } from "@/components/DiscoverBrowser";
import { Reveal } from "@/components/motion/Reveal";
import { pageMetadata } from "@/lib/page-metadata";
import { allPillarPosts } from "@/lib/pillars";

export const metadata = pageMetadata({
  title: "Discover",
  description:
    "Discover: jelajahi fakta musik, lirik, trivia, kutipan, rekomendasi, ulasan, dan clipper dari feed @melodi.alam.",
  path: "/discover",
});

/**
 * The Discover pool. The cards render in `DiscoverBrowser` because search and
 * the pillar chips are client state; the page itself only reads the pool.
 */
export default async function DiscoverPage() {
  const feed = await allPillarPosts();

  return (
    <Reveal>
      <h1 className="pb-4 text-4xl tracking-tight sm:text-5xl">Discover</h1>

      <DiscoverBrowser posts={feed} />
    </Reveal>
  );
}
