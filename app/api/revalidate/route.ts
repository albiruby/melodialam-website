import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { ARTICLES_TAG } from "@/lib/articles";
import { PILLARS_TAG } from "@/lib/pillars";
import { INTERVIEWS_TAG } from "@/lib/interviews";
import { SETTINGS_TAG } from "@/lib/site-settings";
import { VIDEOS_PAGE_TAG } from "@/lib/videos-page";
import { VIDEOS_TAG } from "@/lib/videos";

/**
 * Sanity publish webhook → Next cache invalidation.
 *
 * Cached reads live under tags (`ARTICLES_TAG`, `PILLARS_TAG`,
 * `INTERVIEWS_TAG`, `SETTINGS_TAG`, `VIDEOS_TAG`, `VIDEOS_PAGE_TAG`). Without
 * this route the site still updates, but only once the cache window lapses;
 * with it, pressing Publish in the Studio shows the change on the next
 * request.
 *
 * Point a Sanity webhook at POST /api/revalidate with the projection
 * `{_type, _id}` and a secret, then set the same secret as
 * `SANITY_REVALIDATE_SECRET`. Filter the webhook on the document types whose
 * tags this route bumps: `article`, `pillarPost`, `interview`, `siteSettings`,
 * `video`, `playlist`, `videosPage`. Any request that cannot prove it holds
 * the secret is refused — an open revalidation endpoint is a cache-busting
 * denial of service waiting to happen.
 */

/** Every cache tag a publish in the Studio can invalidate. */
const CONTENT_TAGS = [
  ARTICLES_TAG,
  PILLARS_TAG,
  INTERVIEWS_TAG,
  SETTINGS_TAG,
  VIDEOS_TAG,
  VIDEOS_PAGE_TAG,
];

function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on a length mismatch, which would itself leak length.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * The secrets this route accepts.
 *
 * `SANITY_REVALIDATE_SECRET` is the live one. `SANITY_REVALIDATE_SECRET_PREVIOUS`
 * is the value it had before a rotation, accepted for a short window so the
 * Sanity webhook keeps working while the dashboard is updated to the new
 * secret. Remove that variable once the webhook has been switched over -
 * a secret that is no longer needed should not still open the door.
 */
function acceptedSecrets(): string[] {
  const live = process.env.SANITY_REVALIDATE_SECRET;
  const previous = process.env.SANITY_REVALIDATE_SECRET_PREVIOUS;
  return [live, previous].filter((value): value is string => Boolean(value));
}

export async function POST(request: Request) {
  const secrets = acceptedSecrets();

  if (!secrets.length) {
    return NextResponse.json(
      { error: "SANITY_REVALIDATE_SECRET belum diset di server." },
      { status: 500 },
    );
  }

  const provided =
    request.headers.get("x-webhook-secret") ??
    new URL(request.url).searchParams.get("secret") ??
    "";

  if (!secrets.some((expected) => secretsMatch(provided, expected))) {
    return NextResponse.json({ error: "Secret tidak cocok." }, { status: 401 });
  }

  for (const tag of CONTENT_TAGS) revalidateTag(tag, "max");

  return NextResponse.json({ revalidated: true, tags: CONTENT_TAGS });
}
