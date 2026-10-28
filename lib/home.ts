import type { SiteArticle } from "./articles";
import type { SiteInterview } from "./interviews";
import type { PillarPost } from "./pillars-shared";
import type { SiteVideo } from "./videos";

/**
 * What The homepage shows, chosen once and passed down as plain props.
 *
 * The page itself should read like a homepage, not like a data layer: these
 * selectors keep the rules (which story leads, which session is on stage,
 * which posts make the mosaic) in one pure function that can be tested without
 * Sanity, Next or a browser.
 *
 * The counts are deliberately small. A landing page is an edit, not an index —
 * the full lists stay on /stories, /videos and /kurasi.
 */

export interface HomeContent {
  /** The lead story; its title becomes the page h1. */
  lead: SiteArticle | null;
  /** Three stories in the right-hand "Latest" column. */
  sidebar: SiteArticle[];
  /** Three stories in the "More Top News" row. */
  more: SiteArticle[];
  /** The session on the dark stage. */
  featured: SiteVideo | null;
  /** Two more sessions, shown as the setlist under the stage. */
  setlist: SiteVideo[];
  /** The largest card in the curated section. */
  curatedFeature: PillarPost | null;
  /** Four posts beside the feature, in a 2×2 grid. */
  curatedRest: PillarPost[];
  /** Four interview rows for the Bicara list inside Originals (three on mobile). */
  interviews: SiteInterview[];
}

export interface HomeInput {
  stories: SiteArticle[];
  videos: SiteVideo[];
  interviews: SiteInterview[];
  curated: PillarPost[];
}

/**
 * Pick the homepage's content.
 *
 * The featured session prefers a CMS video that names its artists: a stage
 * section whose headline is a bare catalogue title reads like an archive, not
 * like an invitation. If no CMS video has that detail, the newest CMS video
 * wins, and the catalogue is the last resort.
 *
 * Curated posts without a cover are skipped. An empty 4:5 frame is worse than
 * one fewer card, and the section needs a photograph to work at all. The order
 * is the one returned by `allPillarPosts()` — Studio `order` first, then date —
 * so an editor can pin the three homepage picks without a schema change.
 */
export function selectHomeContent({
  stories,
  videos,
  interviews,
  curated,
}: HomeInput): HomeContent {
  const featured =
    videos.find((video) => video.source === "cms" && video.featuring.length > 0) ??
    videos.find((video) => video.source === "cms") ??
    videos[0] ??
    null;

  const setlist = featured
    ? videos.filter((video) => video.id !== featured.id).slice(0, 2)
    : [];

  const photos = curated.filter(
    (post) => post.mediaType !== "reel" && Boolean(post.image),
  );

  return {
    lead: stories[0] ?? null,
    sidebar: stories.slice(1, 4),
    more: stories.slice(4, 7),
    featured,
    setlist,
    curatedFeature: photos[0] ?? null,
    curatedRest: photos.slice(1, 5),
    interviews: interviews.slice(0, 4),
  };
}
