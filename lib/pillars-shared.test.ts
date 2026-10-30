import { describe, expect, it } from "vitest";
import { coverFit } from "./pillars-shared";

describe("coverFit", () => {
  it("fills a 4:5 cover", () => {
    expect(coverFit({ imageWidth: 1080, imageHeight: 1350 })).toBe("cover");
  });

  it("fills a near-4:5 cover", () => {
    expect(coverFit({ imageWidth: 1000, imageHeight: 1300 })).toBe("cover");
  });

  it("contains a landscape cover instead of cropping it", () => {
    expect(coverFit({ imageWidth: 1600, imageHeight: 900 })).toBe("contain");
  });

  it("contains a square cover", () => {
    expect(coverFit({ imageWidth: 1000, imageHeight: 1000 })).toBe("contain");
  });

  it("fills when the dimensions are unknown", () => {
    expect(coverFit({ imageWidth: null, imageHeight: null })).toBe("cover");
  });
});
