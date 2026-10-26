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

/** `demo-audio/<uuid>.<mp3|wav|ogg>` — no directories, no original filename. */
const AUDIO_PATHNAME =
  /^demo-audio\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(mp3|wav|ogg)$/;

const AUDIO_URL_PATH =
  /^\/demo-audio\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(mp3|wav|ogg)$/;

/** Whether the client's requested pathname is the shape this app issues. */
export function isDemoAudioPathname(pathname: string): boolean {
  return AUDIO_PATHNAME.test(pathname);
}

/**
 * Whether a submitted `audioUrl` is one of our audio objects.
 *
 * When `BLOB_STORE_ID` is set (production), the host must be this store's
 * public/private Blob hostname — not merely any `*.blob.vercel-storage.com`
 * host. The pathname must also be our UUID namespace. Without a store ID the
 * host check falls back to the shared Blob suffix, but the namespace check
 * still applies.
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
  const normalized = storeId?.replace(/^store_/i, "").toLowerCase();
  if (normalized) {
    const allowed = new Set([
      `${normalized}.public.blob.vercel-storage.com`,
      `${normalized}.private.blob.vercel-storage.com`,
      `${normalized}.blob.vercel-storage.com`,
    ]);
    return allowed.has(host);
  }
  return host.endsWith(".blob.vercel-storage.com");
}
