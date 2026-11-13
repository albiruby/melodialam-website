import { describe, expect, it } from "vitest";
import { relativeDate } from "./relative-time";

const NOW = new Date("2026-11-13T10:00:00Z");
const FALLBACK = "16 Jun 2026";

describe("relativeDate", () => {
  it("reads a same-day post in Asia/Jakarta as Hari ini", () => {
    expect(relativeDate("2026-11-13", FALLBACK, NOW)).toBe("Hari ini");
  });

  it("reads a post one day back as Kemarin", () => {
    expect(relativeDate("2026-11-12", FALLBACK, NOW)).toBe("Kemarin");
  });

  it("counts days up to a week", () => {
    expect(relativeDate("2026-11-11", FALLBACK, NOW)).toBe("2 hari lalu");
    expect(relativeDate("2026-11-07", FALLBACK, NOW)).toBe("6 hari lalu");
  });

  it("counts weeks up to a month", () => {
    expect(relativeDate("2026-11-06", FALLBACK, NOW)).toBe("1 minggu lalu");
    expect(relativeDate("2026-10-15", FALLBACK, NOW)).toBe("4 minggu lalu");
  });

  it("hands anything 30 days or older to the absolute fallback", () => {
    expect(relativeDate("2026-10-14", FALLBACK, NOW)).toBe(FALLBACK);
    expect(relativeDate("2026-06-16", FALLBACK, NOW)).toBe(FALLBACK);
    expect(relativeDate("2024-01-01", FALLBACK, NOW)).toBe(FALLBACK);
  });

  it("clamps a future date to Hari ini instead of inventing an age", () => {
    expect(relativeDate("2026-11-14", FALLBACK, NOW)).toBe("Hari ini");
    expect(relativeDate("2030-01-01", FALLBACK, NOW)).toBe("Hari ini");
  });

  it("falls back when the date is missing or malformed", () => {
    expect(relativeDate("", FALLBACK, NOW)).toBe(FALLBACK);
    expect(relativeDate(null, FALLBACK, NOW)).toBe(FALLBACK);
    expect(relativeDate(undefined, FALLBACK, NOW)).toBe(FALLBACK);
    expect(relativeDate("2026-6-16", FALLBACK, NOW)).toBe(FALLBACK);
    expect(relativeDate("bukan tanggal", FALLBACK, NOW)).toBe(FALLBACK);
  });

  it("keeps the caller's own absolute format", () => {
    expect(relativeDate("2026-10-14", "10 Oktober 2026", NOW)).toBe(
      "10 Oktober 2026",
    );
  });

  it("reads today from Asia/Jakarta, not the server's UTC clock", () => {
    // 17:30 UTC on Nov 13 is already Nov 14 00:30 in Jakarta.
    const lateNight = new Date("2026-11-13T17:30:00Z");
    expect(relativeDate("2026-11-13", FALLBACK, lateNight)).toBe("Kemarin");
    expect(relativeDate("2026-11-14", FALLBACK, lateNight)).toBe("Hari ini");
  });
});
