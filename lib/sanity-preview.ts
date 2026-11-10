import { createHmac } from "node:crypto";
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

/* --- Preview session cookie ---------------------------------------------- */

/**
 * The preview secret is accepted once from the query string, then exchanged for
 * an HttpOnly cookie and stripped from the URL. That keeps the secret out of
 * the address bar, browser history, Referer headers and analytics page views.
 *
 * The cookie does not carry the secret itself: it carries an expiry and an
 * HMAC over it, so a stolen cookie expires an hour after it was issued and
 * cannot be edited into a longer session.
 */
export const PREVIEW_COOKIE = "melodi_preview";
export const PREVIEW_TTL_SECONDS = 60 * 60;

function previewSignature(secret: string, expiresAt: number): string {
  return createHmac("sha256", secret).update(`preview:${expiresAt}`).digest("base64url");
}

/** A short-lived token for the preview cookie. */
export function previewToken(secret: string, now = Date.now()): string {
  const expiresAt = Math.floor(now / 1000) + PREVIEW_TTL_SECONDS;
  return `${expiresAt}.${previewSignature(secret, expiresAt)}`;
}

/** Whether a cookie token was issued by us and has not expired yet. */
export function previewTokenMatches(
  token: string | null | undefined,
  secret: string | null,
  now = Date.now(),
): boolean {
  if (!token || !secret) return false;
  const [rawExpires, signature] = token.split(".");
  if (!rawExpires || !signature) return false;
  const expiresAt = Number(rawExpires);
  if (!Number.isSafeInteger(expiresAt) || expiresAt * 1000 <= now) return false;
  return secretMatches(signature, previewSignature(secret, expiresAt));
}
