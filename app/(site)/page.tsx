import { DiscoverNews } from "@/components/home/DiscoverNews";
import { Originals } from "@/components/home/Originals";
import { SubmitCTA } from "@/components/home/SubmitCTA";
import { TopNews } from "@/components/home/TopNews";
import { VideoModal } from "@/components/VideoModal";
import { latestStories } from "@/lib/articles";
import { selectHomeContent } from "@/lib/home";
import { allInterviews } from "@/lib/interviews";
import { pageMetadata } from "@/lib/page-metadata";
import { allPillarPosts } from "@/lib/pillars";
import { SITE } from "@/lib/site";
import { allVideos } from "@/lib/videos";

export const metadata = pageMetadata({
  /**
   * A page in the same segment as its layout does not get that layout's
   * `title.template` applied, so the home page passes its full title and skips
   * the suffix.
   */
  title: `${SITE.name} — ${SITE.tagline}`,
  absolute: true,
  description:
    "Melodi Alam mencatat musik Indonesia lewat jurnalisme, sesi panggung intim di Samsara Bogor, dan post pendek dari feed @melodi.alam.",
  path: "/",
});

/**
 * The news-first homepage.
 *
 * The lead story owns the h1 and the first screen. A Latest column and a
 * three-card More Top News row follow, then the two original programmes, the
 * curated selection, and the open call.
 *
 * The wrapper owns the mobile rhythm (48px between modules instead of 80px).
 * `VideoModal` is the only client mount, shared by the stage and the interview
 * list so both open the same player.
 */
export default async function HomePage() {
  const [stories, videos, interviews, discover] = await Promise.all([
    latestStories(8),
    allVideos(),
    allInterviews(),
    allPillarPosts(),
  ]);

  const content = selectHomeContent({ stories, videos, interviews, discover });

  return (
    <div className="space-y-12 sm:space-y-20">
      <TopNews lead={content.lead} sidebar={content.sidebar} more={content.more} />

      {content.featured || content.interviews.length > 0 ? (
        <Originals
          featured={content.featured}
          setlist={content.setlist}
          interviews={content.interviews}
        />
      ) : null}

      {content.discoverFeature ? (
        <DiscoverNews feature={content.discoverFeature} rest={content.discoverRest} />
      ) : null}

      <SubmitCTA />

      <VideoModal />
    </div>
  );
}
