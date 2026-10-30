import type { PillarPost } from "@/lib/pillars-shared";
import { PillarCard, PillarFeature } from "@/components/PillarCards";
import { SectionBar } from "./SectionBar";

/**
 * Discover: the five newest short-form posts, one clear lead.
 *
 * The section is an etalase, not a second archive. One large post takes half
 * the row; four companions sit in a 2×2 grid beside it on desktop and become
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
        label="Discover"
        href="/discover"
        linkLabel="Jelajahi semua"
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:gap-8">
        <div className={rest.length > 0 ? "lg:col-span-6" : "lg:col-span-12"}>
          <PillarFeature post={feature} eager />
        </div>

        {rest.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:col-span-6 lg:grid-cols-2 lg:grid-rows-2">
            {rest.map((post, index) => (
              <div
                key={post.id}
                className={`${index >= 2 ? "hidden sm:block" : ""} h-full`}
              >
                <PillarCard
                  post={post}
                  showPillar
                  horizontalOnMobile
                  showCta={false}
                  eager
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
