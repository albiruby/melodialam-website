import { describe, expect, it } from "vitest";
import { toPublicDemoRow, type DemoQueueSource } from "./demo-queue";

const APPROVED: DemoQueueSource = {
  id: "demo-1",
  artist: "Shroomeater",
  city: "Bogor",
  genre: "Alternative Rock / Shoegaze",
  program: "Live at Melodi Samsara",
  status: "SHORTLISTED (SAMSARA)",
  submittedAt: "2026-10-12",
};

describe("toPublicDemoRow", () => {
  it("keeps the fields ADR-0005 allows the public queue to show", () => {
    expect(toPublicDemoRow(APPROVED)).toEqual({
      id: "demo-1",
      artist: "Shroomeater",
      city: "Bogor",
      genre: "Alternative Rock / Shoegaze",
      program: "Live at Melodi Samsara",
      status: "SHORTLISTED (SAMSARA)",
      submittedAt: "2026-10-12",
    });
  });

  it("drops the EPK link and the free-text story even when they are present", () => {
    const row = toPublicDemoRow({
      ...APPROVED,
      // The mapper receives a wider document in production; these must not
      // survive the projection.
      link: "https://example.com/epk",
      story: "Hubungi 0812-3456-7890 untuk wawancara.",
    } as DemoQueueSource);

    expect(row).not.toHaveProperty("link");
    expect(row).not.toHaveProperty("story");
    expect(Object.keys(row).sort()).toEqual([
      "artist",
      "city",
      "genre",
      "id",
      "program",
      "status",
      "submittedAt",
    ]);
  });

  it("normalizes a missing genre or program to an empty string", () => {
    expect(toPublicDemoRow({ ...APPROVED, genre: null, program: null })).toMatchObject({
      genre: "",
      program: "",
    });
  });
});
