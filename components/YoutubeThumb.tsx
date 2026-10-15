"use client";

import { useState } from "react";

/**
 * A YouTube poster frame with a fallback.
 *
 * `NFR-001`: a remote thumbnail that fails to load must not leave a broken-image
 * icon or an empty grey box behind. These come from `i.ytimg.com`, the one remote
 * image host this site still depends on, so they are the only images that can
 * fail for a reason outside our control.
 *
 * Kept as a plain `<img>` rather than `next/image`: the optimiser would add a
 * round trip per thumbnail for a file YouTube already serves at the size we ask
 * for, and the catalogue renders dozens of these at once.
 */
export function YoutubeThumb({
  id,
  className = "",
  size = "hqdefault",
}: {
  /** Eleven-character YouTube video id. */
  id: string;
  className?: string;
  size?: "default" | "mqdefault" | "hqdefault" | "sddefault";
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        aria-hidden
        className={`flex items-center justify-center bg-neutral-800 ${className}`}
      >
        <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          poster tidak tersedia
        </span>
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://i.ytimg.com/vi/${id}/${size}.jpg`}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
