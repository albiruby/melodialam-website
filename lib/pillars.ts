import { cacheLife, cacheTag } from "next/cache";
import { contentClient, imageUrl } from "./sanity";
import { type PillarPost } from "./pillars-shared";

/**
 * Instagram feed posts, grouped by content pillar.
 *
 * The pool lives in the Studio ("Konten Pillar"); the home, /discover, Stories and
 * Videos render it. There is no static fallback on purpose — this is new content
 * with no build-time source, so an empty read simply hides the sections.
 *
 * The vocabulary (labels, pillar sets, `pillarDate`) lives in
 * `lib/pillars-shared.ts` and is re-exported here so server code keeps one
 * import. A client component must import the shared module directly: this file
 * pulls in `next/cache` and Sanity.
 */

export {
  PILLAR_LABELS,
  PHOTO_PILLARS,
  REEL_PILLARS,
  pillarDate,
  type PillarPost,
} from "./pillars-shared";

export const PILLARS_TAG = "pillar-posts";

const PILLAR_QUERY = /* groq */ `*[_type == "pillarPost" && defined(igUrl) && defined(title)]
  | order(coalesce(order, 9999) asc, date desc) {
  "id": _id,
  pillar,
  title,
  mediaType,
  date,
  igUrl,
  image,
  "imageWidth": image.asset->metadata.dimensions.width,
  "imageHeight": image.asset->metadata.dimensions.height
}`;

interface PillarDoc {
  id?: string;
  pillar?: string;
  title?: string;
  mediaType?: string;
  date?: string;
  igUrl?: string;
  image?: unknown;
  imageWidth?: number;
  imageHeight?: number;
}

export async function allPillarPosts(): Promise<PillarPost[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(PILLARS_TAG);

  try {
    const docs = await contentClient.fetch<PillarDoc[]>(PILLAR_QUERY, {}, { cache: "no-store" });

    return docs
      .filter((d): d is PillarDoc & { id: string; title: string; igUrl: string } =>
        Boolean(d.id && d.title && d.igUrl),
      )
      .map((d) => ({
        id: d.id,
        pillar: d.pillar ?? "",
        title: d.title,
        mediaType: d.mediaType === "reel" ? ("reel" as const) : ("foto" as const),
        date: typeof d.date === "string" && d.date ? d.date.slice(0, 10) : null,
        igUrl: d.igUrl,
        image: imageUrl(d.image, { width: 900 }),
        imageWidth: typeof d.imageWidth === "number" ? d.imageWidth : null,
        imageHeight: typeof d.imageHeight === "number" ? d.imageHeight : null,
      }));
  } catch {
    // Sections simply do not render when the pool is unreachable.
    return [];
  }
}
