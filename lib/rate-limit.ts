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
 * The client identity is read from forwarding headers only when they are
 * trustworthy: on Vercel the platform sets them; elsewhere `TRUST_PROXY=1` is
 * an explicit opt-in. Without that, every caller shares one bucket.
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
 * Whether the forwarding headers can be trusted on this deployment.
 *
 * On Vercel the platform overwrites `x-forwarded-for` before the function sees
 * it. Anywhere else those headers are caller-controlled unless the operator
 * says a trusted proxy sets them (`TRUST_PROXY=1`). When they are not trusted,
 * every caller shares one bucket — a real limit is better than a bypassable one.
 */
function trustsForwardedHeaders(): boolean {
  return process.env.VERCEL === "1" || process.env.TRUST_PROXY === "1";
}

/**
 * Normalise an address into a stable bucket key.
 *
 * Ports are stripped, IPv4-mapped IPv6 is unwrapped, and IPv6 is collapsed to
 * its /64 prefix: one host controls a whole /64 and could otherwise rotate
 * addresses inside it for a fresh bucket on every request.
 */
function normalizeAddress(value: string): string | null {
  const raw = value.trim().replace(/%.*$/, "");
  if (!raw) return null;

  const v4 = raw.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/);
  if (v4) return v4[1];

  const mapped = raw.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mapped) return mapped[1];

  const bracketed = raw.match(/^\[([0-9a-fA-F:]+)\](?::\d+)?$/);
  const v6 = bracketed?.[1] ?? (raw.includes(":") ? raw : null);
  if (!v6) return raw;

  const [head, tail] = v6.split("::");
  const headParts = head ? head.split(":") : [];
  const tailParts = tail ? tail.split(":") : [];
  let parts: string[];
  if (v6.includes("::")) {
    const missing = 8 - headParts.length - tailParts.length;
    if (missing < 0) return raw.toLowerCase();
    parts = [...headParts, ...Array<string>(missing).fill("0"), ...tailParts];
  } else {
    parts = v6.split(":");
    if (parts.length !== 8) return raw.toLowerCase();
  }
  return `${parts.slice(0, 4).map((part) => part || "0").join(":")}::/64`;
}

/** The caller's address, given explicit trust in the forwarding headers. */
export function clientIpFrom(headers: Headers, trustForwarded: boolean): string {
  if (!trustForwarded) return "untrusted";

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    const normalized = first ? normalizeAddress(first) : null;
    if (normalized) return normalized;
  }

  const real = headers.get("x-real-ip");
  return (real && normalizeAddress(real)) || "unknown";
}

/**
 * The caller's address.
 *
 * The forwarding headers are only read when the platform or the operator says
 * they are trustworthy (see `trustsForwardedHeaders`). The limit itself stays
 * per instance — see the module note at the top.
 */
export function clientIp(request: Request): string {
  return clientIpFrom(request.headers, trustsForwardedHeaders());
}
