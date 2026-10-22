import { describe, expect, it } from "vitest";
import { clientIp, rateLimit } from "./rate-limit";

/**
 * The limiter keeps its counters in module memory, so every case here uses
 * its own key. The keys are namespaced per case to stay independent.
 */
describe("rateLimit", () => {
  it("lets a client through up to the limit", () => {
    const key = "klien-a";
    for (let i = 0; i < 3; i++) {
      const result = rateLimit(key, 3, 60_000);
      expect(result.ok).toBe(true);
      expect(result.remaining).toBe(2 - i);
      expect(result.retryAfter).toBe(0);
    }
  });

  it("refuses the call after the limit and says when to come back", () => {
    const key = "klien-b";
    rateLimit(key, 1, 60_000);
    const blocked = rateLimit(key, 1, 60_000);

    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(blocked.retryAfter).toBeLessThanOrEqual(60);
  });

  it("counts every client separately", () => {
    const first = rateLimit("klien-c", 1, 60_000);
    const second = rateLimit("klien-d", 1, 60_000);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
  });

  it("starts a fresh window once the old one has passed", async () => {
    const key = "klien-e";
    rateLimit(key, 1, 40);
    expect(rateLimit(key, 1, 40).ok).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(rateLimit(key, 1, 40).ok).toBe(true);
  });
});

describe("clientIp", () => {
  function requestWith(headers: Record<string, string>): Request {
    return new Request("https://melodialam-website.vercel.app/api/demos", { headers });
  }

  it("takes the first address of the forwarded chain", () => {
    const request = requestWith({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    expect(clientIp(request)).toBe("203.0.113.7");
  });

  it("falls back to the real ip header", () => {
    const request = requestWith({ "x-real-ip": "198.51.100.4" });
    expect(clientIp(request)).toBe("198.51.100.4");
  });

  it("does not invent an address when there is none", () => {
    expect(clientIp(requestWith({}))).toBe("unknown");
  });
});
