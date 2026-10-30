/**
 * A small rate limiter for the public write endpoints.
 *
 * Why this exists: `/api/demos` and `/api/demo-audio` are the only endpoints
 * on the site that anyone can call without a secret. Each accepted call costs
 * a write to Sanity and, once Resend is connected, a paid email. Without a
 * limit, one script can fill the queue and the mailbox.
 *
 * Two backends, one interface:
 *
 * - **Redis** when `KV_REST_API_URL`/`KV_REST_API_TOKEN` (Vercel KV) or
 *   `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are set. The counter is
 *   shared by every instance, so a burst spread over many functions is caught.
 * - **Memory** otherwise. Each instance keeps its own counter; good enough to
 *   blunt a script locally, but not a global limit. The fallback also runs when
 *   Redis is unreachable, so a cache outage cannot take the forms down.
 *
 * The Redis call is one atomic Lua script (INCR + PEXPIRE + PTTL), so two
 * concurrent requests cannot both create the window. No SDK: the REST API is
 * one `fetch`.
 *
 * The client identity is read from forwarding headers only when they are
 * trustworthy: on Vercel the platform sets them; elsewhere `TRUST_PROXY=1` is
 * an explicit opt-in. Without that, every caller shares one bucket.
 */

/** One client: how many times it called, and when the window resets. */
interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Buckets by key. A module-level map lives as long as the function instance,
 * which is exactly the lifetime we want for the fallback.
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

/** INCR the key, set the window on the first hit, return the count and TTL. */
const REDIS_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then redis.call("PEXPIRE", KEYS[1], ARGV[1]) end
local ttl = redis.call("PTTL", KEYS[1])
return {current, ttl}
`;

interface RedisConfig {
  url: string;
  token: string;
}

function redisConfig(): RedisConfig | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

async function redisRateLimit(
  config: RedisConfig,
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(["eval", REDIS_SCRIPT, 1, `rl:${key}`, String(windowMs)]),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Redis ${response.status}`);
  }

  const payload = (await response.json()) as { result?: [number | string, number | string] };
  const count = Number(payload.result?.[0]);
  const ttl = Number(payload.result?.[1]);
  if (!Number.isFinite(count) || !Number.isFinite(ttl)) {
    throw new Error("Redis returned an unexpected result");
  }

  if (count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil(ttl / 1000)),
    };
  }

  return { ok: true, remaining: Math.max(0, limit - count), retryAfter: 0 };
}

/**
 * Count one call against `key`.
 *
 * @param key     identifies the client, usually its IP address
 * @param limit   how many calls are allowed in the window
 * @param windowMs how long the window lasts
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const config = redisConfig();
  if (config) {
    try {
      return await redisRateLimit(config, key, limit, windowMs);
    } catch (error) {
      console.warn("[rate-limit] Redis gagal, memakai memori:", error);
    }
  }
  return memoryRateLimit(key, limit, windowMs);
}

/** The per-instance fallback, kept synchronous and dependency-free. */
function memoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
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
 * they are trustworthy (see `trustsForwardedHeaders`).
 */
export function clientIp(request: Request): string {
  return clientIpFrom(request.headers, trustsForwardedHeaders());
}
