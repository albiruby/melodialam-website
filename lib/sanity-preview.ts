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


/**
 * The secret a preview link has to carry.
 *
 * `SANITY_PREVIEW_SECRET` and nothing else. It used to fall back to
 * `SANITY_REVALIDATE_SECRET` so the preview would work without a second
 * variable to copy around - but that made one secret unlock two unrelated
 * capabilities, and the revalidate secret had already leaked once. The
 * fallback is gone: reading a draft now needs its own secret.
 */
export function previewSecret(): string | null {
  return process.env.SANITY_PREVIEW_SECRET ?? null;
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
