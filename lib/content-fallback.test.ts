import { describe, expect, it } from "vitest";
import { articleReadingTime, readingTimeMinutes, type Article } from "./content-fallback";
import { pillarDate } from "./pillars";
import { isArticleCategory } from "./taxonomy";

/**
 * BR-004 pins the read time: `max(1, ceil(words / 200))`. These are the cases
 * that used to be argued about by hand.
 */
describe("readingTimeMinutes", () => {
  it("never reports less than a minute", () => {
    expect(readingTimeMinutes("")).toBe(1);
    expect(readingTimeMinutes("satu dua tiga")).toBe(1);
  });

  it("counts a full page of text as one minute", () => {
    expect(readingTimeMinutes(Array.from({ length: 200 }, () => "kata").join(" "))).toBe(1);
  });

  it("rounds up past the page", () => {
    expect(readingTimeMinutes(Array.from({ length: 201 }, () => "kata").join(" "))).toBe(2);
    expect(readingTimeMinutes(Array.from({ length: 1200 }, () => "kata").join(" "))).toBe(6);
  });

  it("reads paragraphs and loose strings alike", () => {
    const body = Array.from({ length: 400 }, () => "kata");
    expect(readingTimeMinutes("dua kata", body)).toBe(3);
  });

  it("includes the title and the excerpt for an article", () => {
    const article = {
      title: "Judul",
      excerpt: "Ringkasan singkat",
      body: Array.from({ length: 200 }, () => "kata"),
    } as unknown as Article;

    expect(articleReadingTime(article)).toBe(2);
  });
});

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
