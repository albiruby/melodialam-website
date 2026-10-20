import { createClient } from "@sanity/client";
import { SANITY_API_VERSION } from "./sanity";
import { SANITY_DATASET, SANITY_PROJECT_ID } from "./sanity-project";

/**
 * Reading UNPUBLISHED drafts of the public `production` dataset.
 *
 * The public client in `lib/sanity.ts` is deliberately tokenless and reads the
 * published perspective, so the site only ever shows what an editor has
 * published. The preview route is the one exception: an editor opens a draft in
 * the Studio and wants to see it on the site before pressing Publish, so this
 * module reads the `drafts` perspective with the editor token.
 *
 * Never import this from a client component — it carries the token.
 */

const token = process.env.SANITY_API_READ_TOKEN;

export const draftClient = token
  ? createClient({
      projectId: SANITY_PROJECT_ID,
      dataset: SANITY_DATASET,
      apiVersion: SANITY_API_VERSION,
      useCdn: false,
      perspective: "drafts",
      token,
    })
  : null;

/** True when draft previews can be rendered at all. */
export const draftPreviewConfigured = draftClient !== null;

/**
 * The secret a preview link has to carry.
 *
 * `SANITY_PREVIEW_SECRET` when it is set, otherwise the revalidate secret —
 * both are editorial secrets the team already has, so the preview works
 * without a second environment variable to copy around.
 */
export function previewSecret(): string | null {
  return process.env.SANITY_PREVIEW_SECRET ?? process.env.SANITY_REVALIDATE_SECRET ?? null;
}

/** Constant-time comparison, so a wrong secret cannot be probed byte by byte. */
export function secretMatches(provided: string | null, expected: string | null): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
