import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { ARTICLES_TAG } from "@/lib/articles";
import { PAHLAWAN_TAG } from "@/lib/pahlawan";

/**
 * Sanity publish webhook → Next cache invalidation.
 *
 * Cached reads live under tags (`ARTICLES_TAG`, `PAHLAWAN_TAG`). Without this
 * route the site still updates, but only once the cache window lapses; with it,
 * pressing Publish in the Studio shows the change on the next request.
 *
 * Point a Sanity webhook at POST /api/revalidate with the projection
 * `{_type, _id}` and a secret, then set the same secret as
 * `SANITY_REVALIDATE_SECRET`. Filter the webhook on the document types whose
 * tags this route bumps: `_type == "article" || _type == "pahlawanRow"`. Any
 * request that cannot prove it holds the secret is refused — an open
 * revalidation endpoint is a cache-busting denial of service waiting to happen.
 */

function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on a length mismatch, which would itself leak length.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const expected = process.env.SANITY_REVALIDATE_SECRET;

  if (!expected) {
    return NextResponse.json(
      { error: "SANITY_REVALIDATE_SECRET belum diset di server." },
      { status: 500 },
    );
  }

  const provided =
    request.headers.get("x-webhook-secret") ??
    new URL(request.url).searchParams.get("secret") ??
    "";

  if (!secretsMatch(provided, expected)) {
    return NextResponse.json({ error: "Secret tidak cocok." }, { status: 401 });
  }

  revalidateTag(ARTICLES_TAG, "max");
  revalidateTag(PAHLAWAN_TAG, "max");

  return NextResponse.json({ revalidated: true, tags: [ARTICLES_TAG, PAHLAWAN_TAG] });
}
