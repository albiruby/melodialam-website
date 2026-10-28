"use client";

import { useState } from "react";

/**
 * A YouTube poster frame, in the best quality YouTube actually has.
 *
 * One mechanism for every thumbnail on the site — the Samsara rows, the
 * Bicara Melodi grid, and the episode index all come through here.
 *
 * YouTube serves the same frame in several sizes:
 *
 * - `maxresdefault` 1280x720 — 16:9, real HD, but missing for videos that were
 *   uploaded below 1080p (the URL answers 404, it does not fall back);
 * - `sddefault` 640x480 and `hqdefault` 480x360 — 4:3, so a 16:9 frame arrives
 *   letterboxed with black bars;
 * - `mqdefault` 320x180 — 16:9 but small.
 *
 * So the browser is offered all of them and picks by `sizes`, and if the
 * variant it picked does not exist, the error handler steps down to the next
 * one. A plain `<img>` is deliberate: `next/image` would resize through
 * Vercel's optimiser, whose CDN keeps remote images for a year — a thumbnail
 * the artist replaces on YouTube would stay stale on the site for months.
 *
 * `NFR-001`: a remote thumbnail that fails to load must not leave a broken-image
 * icon or an empty grey box behind.
 */

/** Best first: HD and 16:9 without letterboxing. */
const VARIANTS = ["maxresdefault", "sddefault", "hqdefault"] as const;

export function YoutubeThumb({
  id,
  className = "",
  sizes = "100vw",
  width = 1280,
  height = 720,
  eager = false,
}: {
  /** Eleven-character YouTube video id. */
  id: string;
  className?: string;
  /** Layout width hint, so the browser picks the right variant. */
  sizes?: string;
  width?: number;
  height?: number;
  /**
   * Fetch immediately at low priority. For the one poster that carries a
   * section, a lazy image can leave a large black frame while the reader is
   * already looking at it; low priority keeps it from competing with the LCP.
   */
  eager?: boolean;
}) {
  const [step, setStep] = useState(0);
  const variant = VARIANTS[Math.min(step, VARIANTS.length - 1)];
  const src = `https://i.ytimg.com/vi/${id}/${variant}.jpg`;

  if (step >= VARIANTS.length) {
    return (
      <span
        aria-hidden
        className={`flex items-center justify-center bg-neutral-800 ${className}`}
      >
        <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-600">
          poster tidak tersedia
        </span>
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      // The browser picks the smallest variant that still covers the slot on
      // this device; the first entry is only a fallback for very old clients.
      srcSet={`https://i.ytimg.com/vi/${id}/mqdefault.jpg 320w, https://i.ytimg.com/vi/${id}/hqdefault.jpg 480w, https://i.ytimg.com/vi/${id}/maxresdefault.jpg 1280w`}
      sizes={sizes}
      alt=""
      width={width}
      height={height}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "low" : "auto"}
      decoding="async"
      // A missing variant (usually maxres on an old upload) steps down instead
      // of leaving a broken image.
      onError={() => setStep((current) => current + 1)}
      className={`bg-neutral-800 ${className}`.trim()}
    />
  );
}
