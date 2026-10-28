import type { PillarPost } from "@/lib/pillars-shared";
import { PillarCard, PillarFeature } from "@/components/PillarCards";
import { SectionBar } from "./SectionBar";

/**
 * Curated: three posts, one clear lead.
 *
 * The section is an etalase, not a second archive. One large post takes two
 * thirds of the row; the two follow-ups stack beside it on desktop and become
 * compact image-left rows on a phone. Titles and one metadata line only.
 */
export function CuratedNews({
  feature,
  rest,
}: {
  feature: PillarPost;
  rest: PillarPost[];
}) {
  return (
    <section aria-labelledby="curated-title">
      <SectionBar
        id="curated-title"
        label="Curated"
        href="/kurasi"
        linkLabel="Semua kurasi"
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:gap-8">
        <div className={rest.length > 0 ? "lg:col-span-6" : "lg:col-span-12"}>
          <PillarFeature post={feature} eager />
        </div>

        {rest.length > 0 ? (
          <div className="grid gap-6 lg:col-span-6 lg:grid-cols-2 lg:gap-5">
            {rest.map((post) => (
              <PillarCard
                key={post.id}
                post={post}
                showPillar
                horizontalOnMobile
                showCta={false}
                eager
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
