import { createImageUrlBuilder } from "@sanity/image-url";
import { createClient } from "next-sanity";

/**
 * Sanity clients.
 *
 * Two datasets, and the split is load-bearing:
 *
 * - `contentClient` reads the PUBLIC `production` dataset — articles and their
 *   images. No token, so nothing here is secret and a fresh checkout without
 *   credentials still type-checks and builds.
 * - The PRIVATE `submissions` dataset (the demo queue, which holds musician
 *   contact details) is reached only through `lib/sanity-server.ts`, which is
 *   the module that carries the token.
 *
 * Keeping the token out of this file is the point: this module is imported by
 * components and by `lib/articles.ts`, and none of that may pull a secret into
 * the client bundle.
 */

/** Pinned so a Sanity API change cannot alter query behaviour underneath us. */
export const SANITY_API_VERSION = "2026-05-19";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

/** False on a fresh checkout with no `.env`: every caller falls back to static. */
export const sanityConfigured = Boolean(projectId && dataset);

export const contentClient =
  projectId && dataset
    ? createClient({
        projectId,
        dataset,
        apiVersion: SANITY_API_VERSION,
        /**
         * The CDN is deliberately off. Article reads are cached in Next under a
         * tag and invalidated by the publish webhook, so a CDN in front would
         * hand back the stale copy we just tried to replace.
         */
        useCdn: false,
        perspective: "published",
      })
    : null;

/**
 * Builds a Sanity CDN image URL with sensible defaults.
 *
 * Returns null rather than throwing when there is no client or no image, so
 * callers can fall back to the placeholder photography in `public/photos`
 * without a try/catch at every call site.
 */
export function imageUrl(
  source: unknown,
  options: { width?: number; height?: number } = {},
): string | null {
  if (!source || !contentClient) return null;

  try {
    const builder = createImageUrlBuilder(contentClient)
      .image(source as never)
      .auto("format")
      .fit("max");

    if (options.width) builder.width(options.width);
    if (options.height) builder.height(options.height);

    return builder.url();
  } catch {
    // A malformed image reference must not take the page down.
    return null;
  }
}
