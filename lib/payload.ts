import type { Payload } from 'payload';

let cached: Payload | null = null;

/**
 * Payload client, or null when no database is configured.
 *
 * The public site must work from a fresh checkout with no credentials, so
 * nothing on a public read path may assume this resolves. Callers fall back to
 * the static layer (`lib/content.ts`, the in-memory queue) and the admin panel
 * plus the database-backed queue fail loudly instead of half-working.
 */
export async function getPayloadClient(): Promise<Payload | null> {
  if (!process.env.DATABASE_URL) return null;
  if (cached) return cached;

  const [{ getPayload }, configModule] = await Promise.all([
    import('payload'),
    import('@/payload.config'),
  ]);
  cached = await getPayload({ config: configModule.default });
  return cached;
}
