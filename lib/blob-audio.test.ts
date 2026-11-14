import { describe, expect, it } from "vitest";
import {
  demoAudioPathname,
  demoAudioUrl,
  isDemoAudioPathname,
  isDemoAudioUrl,
} from "./blob-audio";

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

  it("fails closed when no store ID is configured", () => {
    expect(isDemoAudioUrl(`https://${HOST}/demo-audio/${UUID}.mp3`)).toBe(false);
    expect(isDemoAudioUrl(`https://example.com/demo-audio/${UUID}.mp3`)).toBe(false);
  });

  it("accepts a store ID written with the store_ prefix or stray spaces", () => {
    expect(isDemoAudioUrl(`https://${HOST}/demo-audio/${UUID}.mp3`, ` ${STORE} `)).toBe(true);
    expect(isDemoAudioUrl(`https://${HOST}/demo-audio/${UUID}.mp3`, STORE.replace("store_", ""))).toBe(
      true,
    );
  });
});

describe("demoAudioPathname", () => {
  it("mints the server's own UUID key from the validated extension", () => {
    const pathname = demoAudioPathname("Manager Band - lagu.MP3");
    expect(pathname).toMatch(
      /^demo-audio\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.mp3$/,
    );
    expect(isDemoAudioPathname(pathname ?? "")).toBe(true);
  });

  it("refuses to claim a file without an allowed extension", () => {
    expect(demoAudioPathname("demo.txt")).toBeNull();
    expect(demoAudioPathname("no-extension")).toBeNull();
  });

  it("never leaks the original filename into the key", () => {
    const pathname = demoAudioPathname("manager-name-with-pii.mp3");
    expect(pathname).not.toContain("manager");
    expect(isDemoAudioPathname(pathname ?? "")).toBe(true);
  });
});

describe("demoAudioUrl", () => {
  it("builds the URL in the exact shape the submission route accepts", () => {
    const url = demoAudioUrl(STORE, `demo-audio/${UUID}.mp3`);
    expect(url).toBe(`https://${HOST}/demo-audio/${UUID}.mp3`);
    expect(isDemoAudioUrl(url ?? "", STORE)).toBe(true);
  });

  it("normalizes the store_ prefix, case and stray spaces", () => {
    expect(demoAudioUrl(` ${STORE} `, `demo-audio/${UUID}.mp3`)).toBe(
      `https://${HOST}/demo-audio/${UUID}.mp3`,
    );
  });

  it("fails closed without a store or with a foreign pathname", () => {
    expect(demoAudioUrl(null, `demo-audio/${UUID}.mp3`)).toBeNull();
    expect(demoAudioUrl(undefined, `demo-audio/${UUID}.mp3`)).toBeNull();
    expect(demoAudioUrl(STORE, `elsewhere/${UUID}.mp3`)).toBeNull();
  });
});
