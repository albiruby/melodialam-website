import { describe, expect, it } from "vitest";
import type { SiteArticle } from "./articles";
import { selectHomeContent } from "./home";
import type { SiteInterview } from "./interviews";
import type { PillarPost } from "./pillars-shared";
import type { SiteVideo } from "./videos";

function article(slug: string, dateISO = "2026-10-01"): SiteArticle {
  return {
    slug,
    title: `Judul ${slug}`,
    category: "Fakta Musik",
    date: "1 Oktober 2026",
    dateISO,
    excerpt: "Ringkasan.",
    image: `/photos/${slug}.webp`,
    body: ["Isi."],
    source: "cms",
    mediaType: "foto",
  };
}

function video(
  id: string,
  source: "cms" | "catalogue" = "cms",
  featuring: string[] = [],
): SiteVideo {
  return {
    id,
    title: `Sesi ${id}`,
    duration: "10:00",
    seconds: 600,
    views: "1K",
    uploaded: "hari ini",
    featuring,
    venue: "Samsara Bogor",
    url: `https://www.youtube.com/watch?v=${id}`,
    source,
  };
}

function post(
  id: string,
  {
    image = "/photos/post.webp",
    mediaType = "foto",
    date = "2026-10-01",
  }: {
    image?: string | null;
    mediaType?: "foto" | "reel";
    date?: string;
  } = {},
): PillarPost {
  return {
    id,
    pillar: "fakta-musik",
    title: `Post ${id}`,
    mediaType,
    date,
    igUrl: `https://www.instagram.com/p/${id}/`,
    image,
    imageWidth: 1080,
    imageHeight: 1350,
  };
}

function interview(slug: string): SiteInterview {
  return {
    slug,
    artist: `Artis ${slug}`,
    headline: "Judul obrolan",
    videoId: `vid-${slug}`,
    caption: "Bicara Melodi",
    source: "static",
  };
}

describe("selectHomeContent", () => {
  it("takes the newest story as the lead and never repeats it below", () => {
    const content = selectHomeContent({
      stories: [article("a"), article("b"), article("c"), article("d")],
      videos: [],
      interviews: [],
      curated: [],
    });

    expect(content.lead?.slug).toBe("a");
    expect(content.sidebar.map((item) => item.slug)).toEqual(["b", "c", "d"]);
    expect(content.more).toEqual([]);
  });

  it("caps the sidebar and the More Top News row at three each", () => {
    const content = selectHomeContent({
      stories: Array.from({ length: 8 }, (_, i) => article(`s${i}`)),
      videos: [],
      interviews: [],
      curated: [],
    });

    expect(content.sidebar).toHaveLength(3);
    expect(content.more).toHaveLength(3);
    expect(content.more.map((item) => item.slug)).toEqual(["s4", "s5", "s6"]);
  });

  it("caps the setlist at two sessions", () => {
    const content = selectHomeContent({
      stories: [],
      videos: [
        video("featured", "cms", ["Artis"]),
        video("a"),
        video("b"),
        video("c"),
      ],
      interviews: [],
      curated: [],
    });

    expect(content.featured?.id).toBe("featured");
    expect(content.setlist.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("prefers a CMS session that names its artists", () => {
    const content = selectHomeContent({
      stories: [],
      videos: [
        video("archive", "catalogue"),
        video("cms-no-featuring", "cms"),
        video("cms-with-featuring", "cms", ["Artis"]),
      ],
      interviews: [],
      curated: [],
    });

    expect(content.featured?.id).toBe("cms-with-featuring");
    expect(content.setlist.map((item) => item.id)).toEqual([
      "archive",
      "cms-no-featuring",
    ]);
  });

  it("falls back to the newest CMS video, then the catalogue", () => {
    const cms = selectHomeContent({
      stories: [],
      videos: [video("archive", "catalogue"), video("cms", "cms")],
      interviews: [],
      curated: [],
    });
    expect(cms.featured?.id).toBe("cms");

    const archive = selectHomeContent({
      stories: [],
      videos: [video("archive", "catalogue")],
      interviews: [],
      curated: [],
    });
    expect(archive.featured?.id).toBe("archive");
    expect(archive.setlist).toEqual([]);
  });

  it("keeps curated photos with a cover, follows the editor order, and skips reels", () => {
    const content = selectHomeContent({
      stories: [],
      videos: [],
      interviews: [],
      curated: [
        post("old", { date: "2026-09-01" }),
        post("new", { date: "2026-10-05" }),
        post("reel", { mediaType: "reel", date: "2026-10-09" }),
        post("no-image", { image: null, date: "2026-10-10" }),
        post("older", { date: "2026-08-01" }),
      ],
    });

    expect(content.curatedFeature?.id).toBe("old");
    expect(content.curatedRest.map((item) => item.id)).toEqual(["new", "older"]);
  });

  it("caps the curated rows at two posts", () => {
    const content = selectHomeContent({
      stories: [],
      videos: [],
      interviews: [],
      curated: [
        post("a", { date: "2026-10-05" }),
        post("b", { date: "2026-10-04" }),
        post("c", { date: "2026-10-03" }),
        post("d", { date: "2026-10-02" }),
      ],
    });

    expect(content.curatedFeature?.id).toBe("a");
    expect(content.curatedRest.map((item) => item.id)).toEqual(["b", "c"]);
  });

  it("returns empty slots when the pool is empty", () => {
    const content = selectHomeContent({
      stories: [],
      videos: [],
      interviews: [],
      curated: [],
    });

    expect(content).toEqual({
      lead: null,
      sidebar: [],
      more: [],
      featured: null,
      setlist: [],
      curatedFeature: null,
      curatedRest: [],
      interviews: [],
    });
  });

  it("shows at most three interview rows", () => {
    const content = selectHomeContent({
      stories: [],
      videos: [],
      interviews: [interview("a"), interview("b"), interview("c"), interview("d")],
      curated: [],
    });

    expect(content.interviews.map((item) => item.slug)).toEqual(["a", "b", "c"]);
  });
});
