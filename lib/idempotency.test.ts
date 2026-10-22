import { describe, expect, it } from "vitest";
import { recall, remember } from "./idempotency";

describe("idempotency", () => {
  it("does not know an answer it never gave", () => {
    expect(recall("kunci-yang-tidak-pernah-dipakai")).toBeNull();
    expect(recall(null)).toBeNull();
    expect(recall("   ")).toBeNull();
  });

  it("gives back the same answer for the same key", () => {
    remember("kunci-1", 201, { ok: true, entry: { id: "demo-1" } });

    const answer = recall("kunci-1");
    expect(answer?.status).toBe(201);
    expect(answer?.body).toEqual({ ok: true, entry: { id: "demo-1" } });
  });

  it("ignores a key that is too long to be a key", () => {
    const panjang = "x".repeat(201);
    remember(panjang, 201, { ok: true });

    expect(recall(panjang)).toBeNull();
  });

  it("does not answer for a key that was never remembered", () => {
    remember("kunci-2", 201, { ok: true });
    expect(recall("kunci-3")).toBeNull();
  });
});
