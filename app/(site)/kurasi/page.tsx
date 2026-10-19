import type { Metadata } from "next";
import { PillarCard, PillarHead, PillarRow } from "@/components/PillarCards";
import { Reveal } from "@/components/Reveal";
import { allPillarPosts, PILLAR_LABELS, PHOTO_PILLARS, REEL_PILLARS } from "@/lib/pillars";

export const metadata: Metadata = {
  title: "Kurasi",
  description:
    "Kurasi tim Melodi Alam dari feed Instagram: fakta musik, lirik, trivia, kutipan, rekomendasi melodi, ulas melodi, dan clipper.",
};

/** How many curated posts each pillar shows; the rest lives on Instagram. */
const PILLAR_LIMIT = 6;

export default async function KurasiPage() {
  const feed = await allPillarPosts();

  // Photo pillars read as cards; reel pillars read as rows. Sections carry
  // their pillar key as an id so /kurasi#fakta-musik can be linked directly.
  const group = (keys: string[]) =>
    keys
      .map((key) => ({
        key,
        label: PILLAR_LABELS[key] ?? key,
        pool: feed.filter((post) => post.pillar === key),
      }))
      .filter((pillar) => pillar.pool.length > 0);

  const readPillars = group(PHOTO_PILLARS);
  const watchPillars = group(REEL_PILLARS);

  return (
    <Reveal>
      <div className="flex items-baseline justify-between pb-4">
        <h2 className="text-4xl tracking-tight sm:text-5xl">Kurasi</h2>
        <span className="font-serif text-sm italic text-neutral-600">
          (pilihan tim dari feed @melodi.alam)
        </span>
      </div>

      {readPillars.length > 0 ? (
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-500">
            Baca — dari feed @melodi.alam
          </span>
          {readPillars.map((pillar) => (
            <section key={pillar.key} id={pillar.key} className="scroll-mt-24 pt-6">
              <PillarHead
                label={pillar.label}
                note={`${Math.min(pillar.pool.length, PILLAR_LIMIT)} post kurasi`}
              />
              <div className="grid grid-cols-1 gap-6 border-b border-ink py-6 sm:grid-cols-2 lg:grid-cols-3">
                {pillar.pool.slice(0, PILLAR_LIMIT).map((post) => (
                  <PillarCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {watchPillars.length > 0 ? (
        <div className="pt-14">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-500">
            Tonton — dari feed @melodi.alam
          </span>
          {watchPillars.map((pillar) => (
            <section key={pillar.key} id={pillar.key} className="scroll-mt-24 pt-6">
              <PillarHead
                label={pillar.label}
                note={`${Math.min(pillar.pool.length, PILLAR_LIMIT)} post kurasi`}
              />
              <div className="divide-y divide-neutral-300 border-b border-ink">
                {pillar.pool.slice(0, PILLAR_LIMIT).map((post, i) => (
                  <PillarRow key={post.id} post={post} index={i} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </Reveal>
  );
}
