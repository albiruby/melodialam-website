import { createImageUrlBuilder } from "@sanity/image-url";
import { createClient } from "next-sanity";
import { SANITY_DATASET, SANITY_PROJECT_ID } from "./sanity-project";

/**
 * Sanity clients.
 *
 * Two datasets, and the split is load-bearing:
 *
 * - `contentClient` reads the PUBLIC `production` dataset — articles and their
 *   images. No token, so nothing here is secret and it is always available.
 * - The PRIVATE `submissions` dataset (the demo queue, which holds musician
 *   contact details) is reached only through `lib/sanity-server.ts`, the module
 *   that carries the token.
 *
 * Keeping the token out of this file is the point: this module is imported by
 * components and by `lib/articles.ts`, and none of that may pull a secret into
 * the client bundle.
 *
 * The project id and dataset are literals (see `lib/sanity-project.ts`), so this
 * client needs no environment variable and exists on a fresh checkout. That is
 * deliberate: the articles ARE the site's content, and reading them should not
 * depend on local setup. If Sanity cannot be reached, `lib/articles.ts` falls
 * back to the static articles in `lib/content.ts`.
 */

/** Pinned so a Sanity API change cannot alter query behaviour underneath us. */
export const SANITY_API_VERSION = "2026-05-19";

export const contentClient = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  /**
   * The CDN is deliberately off. Article reads are cached in Next under a tag
   * and invalidated by the publish webhook, so a CDN in front would hand back the
   * stale copy we just tried to replace.
   */
  useCdn: false,
  perspective: "published",
});

/**
 * Builds a Sanity CDN image URL with sensible defaults.
 *
 * Returns null rather than throwing when there is no image, so callers can fall
 * back to the placeholder photography in `public/photos` without a try/catch at
 * every call site.
 */
export function imageUrl(
  source: unknown,
  options: { width?: number; height?: number } = {},
): string | null {
  if (!source) return null;

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
