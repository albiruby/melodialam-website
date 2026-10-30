import { DiscoverBrowser } from "@/components/DiscoverBrowser";
import { Reveal } from "@/components/motion/Reveal";
import { jsonLdScript } from "@/lib/json-ld";
import { pageMetadata } from "@/lib/page-metadata";
import { allPillarPosts } from "@/lib/pillars";
import { SITE } from "@/lib/site";

const DESCRIPTION =
  "Discover: jelajahi fakta musik, lirik, trivia, kutipan, rekomendasi, ulasan, dan clipper dari feed @melodi.alam.";

export const metadata = pageMetadata({
  title: "Discover",
  description: DESCRIPTION,
  path: "/discover",
  image: "/og-discover.png",
});

/**
 * The Discover pool. The cards render in `DiscoverBrowser` because search and
 * the pillar chips are client state; the page itself only reads the pool.
 */
export default async function DiscoverPage() {
  const feed = await allPillarPosts();
  const ordered = [...feed].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Discover — ${SITE.name}`,
    description: DESCRIPTION,
    url: `${SITE.url}/discover`,
    isPartOf: {
      "@type": "WebSite",
      name: SITE.name,
      url: SITE.url,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: ordered.length,
      itemListElement: ordered.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: post.igUrl,
        name: post.title,
      })),
    },
  };

  return (
    <Reveal>
      <h1 className="pb-4 text-4xl tracking-tight sm:text-5xl">Discover</h1>

      <DiscoverBrowser posts={feed} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />
    </Reveal>
  );
}
