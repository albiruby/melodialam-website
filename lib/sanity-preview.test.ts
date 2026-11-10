import { describe, expect, it } from "vitest";
import { PREVIEW_TTL_SECONDS, previewToken, previewTokenMatches } from "./sanity-preview";

const SECRET = "test-preview-secret";
const NOW = 1_800_000_000_000;

describe("previewTokenMatches", () => {
  it("accepts a token issued with the same secret", () => {
    const token = previewToken(SECRET, NOW);
    expect(previewTokenMatches(token, SECRET, NOW)).toBe(true);
  });

  it("rejects the token once its hour has passed", () => {
    const token = previewToken(SECRET, NOW);
    expect(previewTokenMatches(token, SECRET, NOW + PREVIEW_TTL_SECONDS * 1000)).toBe(false);
    expect(previewTokenMatches(token, SECRET, NOW + (PREVIEW_TTL_SECONDS + 1) * 1000)).toBe(false);
  });

  it("rejects a token signed with a different secret", () => {
    expect(previewTokenMatches(previewToken("other-secret", NOW), SECRET, NOW)).toBe(false);
  });

  it("rejects a token whose expiry was edited without re-signing", () => {
    const [expiresAt, signature] = previewToken(SECRET, NOW).split(".");
    const extended = `${Number(expiresAt) + 3600}.${signature}`;
    expect(previewTokenMatches(extended, SECRET, NOW)).toBe(false);
  });

  it("rejects a missing token, a malformed token, or a missing secret", () => {
    expect(previewTokenMatches(null, SECRET, NOW)).toBe(false);
    expect(previewTokenMatches("not-a-token", SECRET, NOW)).toBe(false);
    expect(previewTokenMatches(previewToken(SECRET, NOW), null, NOW)).toBe(false);
  });
});
