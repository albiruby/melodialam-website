import { describe, expect, it } from "vitest";
import { pillarDate } from "./pillars";
import { isArticleCategory } from "./taxonomy";

describe("pillarDate", () => {
  it("formats an ISO date the way the cards read it", () => {
    expect(pillarDate("2026-03-04")).toBe("4 Mar 2026");
    expect(pillarDate("2026-10-12")).toBe("12 Okt 2026");
  });

  it("renders nothing when the editor left the date empty", () => {
    expect(pillarDate(null)).toBe("");
    expect(pillarDate("")).toBe("");
    expect(pillarDate("bukan-tanggal")).toBe("");
  });
});

describe("isArticleCategory", () => {
  it("accepts the desks the schema knows", () => {
    expect(isArticleCategory("Fakta Musik")).toBe(true);
  });

  it("rejects anything else, including non-strings", () => {
    expect(isArticleCategory("Berita Panas")).toBe(false);
    expect(isArticleCategory(undefined)).toBe(false);
    expect(isArticleCategory(42)).toBe(false);
  });
});
