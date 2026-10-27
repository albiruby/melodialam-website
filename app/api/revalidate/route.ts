import { createHmac, timingSafeEqual } from "node:crypto";
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

/**
 * How far apart the clocks may be and the signature is still accepted.
 *
 * The timestamp is part of what is signed, so a captured request cannot be
 * replayed forever.
 */
const SIGNATURE_WINDOW_SECONDS = 300;

/**
 * Webhook payloads are a few hundred bytes; refuse anything larger before the
 * body is buffered. The cap is applied to the stream, not just to a
 * `Content-Length` header a caller can omit.
 */
const MAX_BODY_BYTES = 16 * 1024;

async function readRawBody(request: Request): Promise<string | null> {
  const declared = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return null;
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

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

/**
 * Whether Sanity's own signature proves the request came from Sanity.
 *
 * When a webhook has a secret, Sanity signs the raw body with it and sends
 * the result in `sanity-webhook-signature: t=<timestamp>,v1=<signature>`,
 * where the signature is an HMAC-SHA256 of `<timestamp>.<raw body>`. The
 * secret itself never travels, so it cannot be read out of a proxy log.
 *
 * The body has to be the raw bytes, exactly as they arrived: parsing it
 * first and re-serialising it would change the bytes and break the
 * comparison.
 */
function signatureIsValid(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;

  const parts = new Map<string, string>();
  for (const piece of header.split(",")) {
    const [key, value] = piece.trim().split("=");
    if (key && value) parts.set(key, value);
  }

  const timestamp = parts.get("t");
  const signature = parts.get("v1");
  if (!timestamp || !signature) return false;

  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds)) return false;
  if (Math.abs(Date.now() / 1000 - seconds) > SIGNATURE_WINDOW_SECONDS) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("base64url");

  const provided = Buffer.from(signature);
  const computed = Buffer.from(expected);
  if (provided.length !== computed.length) return false;
  return timingSafeEqual(provided, computed);
}

export async function POST(request: Request) {
  const secrets = acceptedSecrets();

  if (!secrets.length) {
    return NextResponse.json(
      { error: "SANITY_REVALIDATE_SECRET belum diset di server." },
      { status: 500 },
    );
  }

  // The raw body, read before anything else: the signature covers exactly
  // these bytes. The read is capped so an unauthenticated caller cannot make
  // the route buffer an arbitrarily large body before the secret check.
  const rawBody = await readRawBody(request);
  if (rawBody === null) {
    return NextResponse.json({ error: "Body terlalu besar." }, { status: 413 });
  }

  const signature = request.headers.get("sanity-webhook-signature");
  const header = request.headers.get("x-webhook-secret");

  // Either proof is accepted: Sanity's signature, or the shared secret in a
  // header. The signature is the stronger of the two, because the secret
  // itself never leaves Sanity.
  const signed = secrets.some((secret) => signatureIsValid(rawBody, signature, secret));
  const headed = header !== null && secrets.some((secret) => secretsMatch(header, secret));

  if (!signed && !headed) {
    return NextResponse.json({ error: "Secret tidak cocok." }, { status: 401 });
  }

  for (const tag of CONTENT_TAGS) revalidateTag(tag, "max");

  return NextResponse.json({ revalidated: true, tags: CONTENT_TAGS });
}
