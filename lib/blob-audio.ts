/**
 * Rules for a demo audio object, shared by the upload-token route and the
 * submission route.
 *
 * The key is a UUID under `demo-audio/`, never the original filename: a
 * manager's file name can carry a person's name, and the old key put it in a
 * public URL. The server validates the shape before minting a token, and the
 * submission route validates the URL that comes back, so the two sides cannot
 * drift apart.
 */

import { DEMO_AUDIO_EXTENSIONS } from "./taxonomy";

/** `demo-audio/<uuid>.<mp3|wav|ogg>` — no directories, no original filename. */
const AUDIO_PATHNAME =
  /^demo-audio\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(mp3|wav|ogg)$/;

const AUDIO_URL_PATH =
  /^\/demo-audio\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(mp3|wav|ogg)$/;

/**
 * Whether any submission has claimed this exact audio URL.
 *
 * The mint route runs it before generating a token: a pathname no submission
 * claimed is refused, so upload objects can only ever follow a real demo.
 */
export const DEMO_AUDIO_CLAIM_COUNT_QUERY = /* groq */ `count(*[_type == "demoSubmission" && audioUrl == $url])`;

/**
 * The object key for a new demo audio: a fresh UUID plus the extension the
 * form already validated. The server decides the key — the client never
 * chooses it — and a file without an allowed extension refuses to claim.
 */
export function demoAudioPathname(fileName: string): string | null {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!(DEMO_AUDIO_EXTENSIONS as readonly string[]).includes(`.${extension}`)) {
    return null;
  }
  return `demo-audio/${crypto.randomUUID()}.${extension}`;
}

/**
 * The canonical public URL for a pathname in this store, in the exact shape
 * `isDemoAudioUrl` accepts. Null without a store ID or a valid pathname, so a
 * claim can never point at a foreign host.
 */
export function demoAudioUrl(
  storeId: string | null | undefined,
  pathname: string,
): string | null {
  if (!isDemoAudioPathname(pathname)) return null;
  const normalized = storeId?.trim().replace(/^store_/i, "").toLowerCase();
  if (!normalized) return null;
  return `https://${normalized}.public.blob.vercel-storage.com/${pathname}`;
}

/** Whether the client's requested pathname is the shape this app issues. */
export function isDemoAudioPathname(pathname: string): boolean {
  return AUDIO_PATHNAME.test(pathname);
}

/**
 * Whether a submitted `audioUrl` is one of our audio objects.
 *
 * The host must be this store's Blob hostname — not merely any
 * `*.blob.vercel-storage.com` host — and the pathname must be our UUID
 * namespace. Without `BLOB_STORE_ID` there is no way to prove the host belongs
 * to us, so the check fails closed rather than accepting a foreign store.
 */
export function isDemoAudioUrl(value: string, storeId?: string | null): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (!AUDIO_URL_PATH.test(url.pathname)) return false;

  const host = url.hostname.toLowerCase();
  const normalized = storeId?.trim().replace(/^store_/i, "").toLowerCase();
  if (!normalized) return false;

  const allowed = new Set([
    `${normalized}.public.blob.vercel-storage.com`,
    `${normalized}.private.blob.vercel-storage.com`,
    `${normalized}.blob.vercel-storage.com`,
  ]);
  return allowed.has(host);
}
