import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clientIpFrom, rateLimit } from "./rate-limit";

/**
 * The limiter falls back to module memory, so every case here uses its own key.
 * The keys are namespaced per case to stay independent.
 */
const REDIS_ENV = [
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

function clearRedisEnv() {
  for (const name of REDIS_ENV) delete process.env[name];
}

beforeEach(clearRedisEnv);
afterEach(() => {
  vi.unstubAllGlobals();
  clearRedisEnv();
});

describe("rateLimit", () => {
  it("lets a client through up to the limit", async () => {
    const key = "klien-a";
    for (let i = 0; i < 3; i++) {
      const result = await rateLimit(key, 3, 60_000);
      expect(result.ok).toBe(true);
      expect(result.remaining).toBe(2 - i);
      expect(result.retryAfter).toBe(0);
    }
  });

  it("refuses the call after the limit and says when to come back", async () => {
    const key = "klien-b";
    await rateLimit(key, 1, 60_000);
    const blocked = await rateLimit(key, 1, 60_000);

    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(blocked.retryAfter).toBeLessThanOrEqual(60);
  });

  it("counts every client separately", async () => {
    const first = await rateLimit("klien-c", 1, 60_000);
    const second = await rateLimit("klien-d", 1, 60_000);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
  });

  it("starts a fresh window once the old one has passed", async () => {
    const key = "klien-e";
    await rateLimit(key, 1, 40);
    expect((await rateLimit(key, 1, 40)).ok).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect((await rateLimit(key, 1, 40)).ok).toBe(true);
  });

  it("uses the shared Redis counter when configured", async () => {
    process.env.KV_REST_API_URL = "https://kv.example";
    process.env.KV_REST_API_TOKEN = "token";
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ result: [1, 60_000] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await rateLimit("redis-a", 3, 60_000);

    expect(result).toEqual({ ok: true, remaining: 2, retryAfter: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calls = fetchMock.mock.calls as unknown as [RequestInfo | URL, RequestInit?][];
    const init = calls[0]?.[1];
    const body = JSON.parse(String(init?.body)) as unknown[];
    expect(body[0]).toBe("eval");
    expect(body[3]).toBe("rl:redis-a");
  });

  it("falls back to memory when Redis is unreachable", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://kv.example";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 503 })),
    );

    const result = await rateLimit("redis-down", 1, 60_000);
    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(0);
  });
});

describe("clientIp", () => {
  function requestWith(headers: Record<string, string>): Request {
    return new Request("https://melodialam-website.vercel.app/api/demos", { headers });
  }

  it("takes the first address of the forwarded chain", () => {
    const request = requestWith({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    expect(clientIpFrom(request.headers, true)).toBe("203.0.113.7");
  });

  it("falls back to the real ip header", () => {
    const request = requestWith({ "x-real-ip": "198.51.100.4" });
    expect(clientIpFrom(request.headers, true)).toBe("198.51.100.4");
  });

  it("does not invent an address when there is none", () => {
    expect(clientIpFrom(requestWith({}).headers, true)).toBe("unknown");
  });

  it("ignores forwarded headers when the proxy is not trusted", () => {
    const request = requestWith({ "x-forwarded-for": "203.0.113.7" });
    expect(clientIpFrom(request.headers, false)).toBe("untrusted");
  });

  it("strips an IPv4 port", () => {
    const request = requestWith({ "x-forwarded-for": "203.0.113.7:4711" });
    expect(clientIpFrom(request.headers, true)).toBe("203.0.113.7");
  });

  it("collapses an IPv6 address to its /64 prefix", () => {
    const full = requestWith({ "x-forwarded-for": "2001:db8:abcd:1234:5678:9abc:def0:1111" });
    const other = requestWith({ "x-forwarded-for": "2001:db8:abcd:1234::99" });
    const outside = requestWith({ "x-forwarded-for": "2001:db8:abcd:9999::1" });

    expect(clientIpFrom(full.headers, true)).toBe("2001:db8:abcd:1234::/64");
    expect(clientIpFrom(other.headers, true)).toBe("2001:db8:abcd:1234::/64");
    expect(clientIpFrom(outside.headers, true)).not.toBe("2001:db8:abcd:1234::/64");
  });

  it("unwraps an IPv4-mapped IPv6 address", () => {
    const request = requestWith({ "x-forwarded-for": "::ffff:203.0.113.7" });
    expect(clientIpFrom(request.headers, true)).toBe("203.0.113.7");
  });
});
