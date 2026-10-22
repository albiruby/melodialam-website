/**
 * A small rate limiter for the public write endpoints.
 *
 * Why this exists: `/api/demos` and `/api/demo-audio` are the only endpoints
 * on the site that anyone can call without a secret. Each accepted call costs
 * a write to Sanity and, once Resend is connected, a paid email. Without a
 * limit, one script can fill the queue and the mailbox.
 *
 * What it is: a counter per client, kept in the memory of the running
 * function. It is deliberately small and has no dependencies.
 *
 * What it is not: a distributed limit. Serverless functions are stateless, so
 * each instance keeps its own counter and a burst spread over many instances
 * is only partly caught. That is good enough to blunt a script and bad enough
 * that it must not be the only defence — the honeypot field and the
 * `Idempotency-Key` in `/api/demos` cover the rest.
 *
 * When the plan allows, move this to the edge: a Vercel Firewall rate-limit
 * rule (Pro and up) or a shared store such as Upstash Redis would make the
 * limit global instead of per instance. The interface below does not need to
 * change when that happens.
 */

/** One client: how many times it called, and when the window resets. */
interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Buckets by key. A module-level map lives as long as the function instance,
 * which is exactly the lifetime we want.
 */
const buckets = new Map<string, Bucket>();

/** A hard cap on remembered clients, so the map cannot grow without end. */
const MAX_BUCKETS = 10_000;

export interface RateLimitResult {
  /** Whether the call may proceed. */
  ok: boolean;
  /** How many calls are left in this window. */
  remaining: number;
  /** Seconds until the window resets; 0 when the call is allowed. */
  retryAfter: number;
}

/**
 * Count one call against `key`.
 *
 * @param key     identifies the client, usually its IP address
 * @param limit   how many calls are allowed in the window
 * @param windowMs how long the window lasts
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  // Drop buckets that have expired, and refuse to remember more than the cap.
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(k);
    }
    if (buckets.size > MAX_BUCKETS) {
      const oldest = buckets.keys().next();
      if (!oldest.done) buckets.delete(oldest.value);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  return { ok: true, remaining: limit - bucket.count, retryAfter: 0 };
}

/**
 * The caller's address.
 *
 * `x-forwarded-for` is the first address in the chain that Vercel sets, so
 * the value cannot be forged by the caller the way a header the client sets
 * freely can. The list is still a header, so it is a best effort, not a proof.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
