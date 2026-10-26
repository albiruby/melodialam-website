import { describe, expect, it } from "vitest";
import { isDemoAudioPathname, isDemoAudioUrl } from "./blob-audio";

const UUID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const STORE = "store_5RKzQCxeKhkgmBSH";
const HOST = "5rkzqcxekhkgmbsh.public.blob.vercel-storage.com";

describe("isDemoAudioPathname", () => {
  it("accepts a UUID key with an allowed extension", () => {
    expect(isDemoAudioPathname(`demo-audio/${UUID}.mp3`)).toBe(true);
    expect(isDemoAudioPathname(`demo-audio/${UUID}.wav`)).toBe(true);
    expect(isDemoAudioPathname(`demo-audio/${UUID}.ogg`)).toBe(true);
  });

  it("rejects the original filename, timestamps and other extensions", () => {
    expect(isDemoAudioPathname("demo-audio/1712345678-band-name.mp3")).toBe(false);
    expect(isDemoAudioPathname(`demo-audio/${UUID}.flac`)).toBe(false);
    expect(isDemoAudioPathname(`other/${UUID}.mp3`)).toBe(false);
    expect(isDemoAudioPathname(`demo-audio/../${UUID}.mp3`)).toBe(false);
    expect(isDemoAudioPathname(`demo-audio/${UUID}.mp3.exe`)).toBe(false);
  });
});

describe("isDemoAudioUrl", () => {
  it("accepts this store's public host and the UUID namespace", () => {
    expect(isDemoAudioUrl(`https://${HOST}/demo-audio/${UUID}.mp3`, STORE)).toBe(true);
  });

  it("rejects another Blob store even when the path looks right", () => {
    const foreign = `https://someoneelse.public.blob.vercel-storage.com/demo-audio/${UUID}.mp3`;
    expect(isDemoAudioUrl(foreign, STORE)).toBe(false);
  });

  it("rejects a foreign pathname, plain http, and a filename with PII", () => {
    expect(isDemoAudioUrl(`https://${HOST}/elsewhere/${UUID}.mp3`, STORE)).toBe(false);
    expect(isDemoAudioUrl(`http://${HOST}/demo-audio/${UUID}.mp3`, STORE)).toBe(false);
    expect(isDemoAudioUrl(`https://${HOST}/demo-audio/manager-name.mp3`, STORE)).toBe(false);
  });

  it("falls back to the Blob suffix only when no store ID is configured", () => {
    expect(isDemoAudioUrl(`https://${HOST}/demo-audio/${UUID}.mp3`)).toBe(true);
    expect(isDemoAudioUrl(`https://example.com/demo-audio/${UUID}.mp3`)).toBe(false);
  });
});
