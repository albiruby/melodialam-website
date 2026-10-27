"use client";

import { useState } from "react";
import type { TickerItem } from "@/lib/site-settings";
import { MarqueeTape } from "./motion/MarqueeTape";

/**
 * Infinite ticker. `MarqueeTape` owns the loop and duplicates the entries, so
 * the scroll-velocity coupling stays seamless.
 *
 * The strip moves by default, which is exactly the kind of content WCAG 2.2.2
 * asks for a control over: the pause button is that control, and focus inside
 * the strip pauses it too, so a keyboard user can read and click a link.
 *
 * The items come from the `siteSettings` singleton, handed down by the layout:
 * this component sits inside `MotionRoot`, which is a client boundary, so it
 * cannot read the CMS itself.
 */
export function Ticker({ items }: { items: TickerItem[] }) {
  const [paused, setPaused] = useState(false);

  const run = items.map((item, i) => (
    <TickerEntry key={i} label={item.label} href={item.href} />
  ));

  return (
    <div
      role="region"
      aria-label="Info terbaru"
      className="relative overflow-hidden border-b border-ink bg-ink py-1.5 text-[11px] uppercase tracking-widest text-white"
    >
      <MarqueeTape paused={paused}>{run}</MarqueeTape>
      <button
        type="button"
        onClick={() => setPaused((value) => !value)}
        aria-pressed={paused}
        aria-label={paused ? "Putar ticker" : "Jeda ticker"}
        className="absolute right-0 top-0 z-10 flex h-full min-h-6 min-w-6 items-center justify-center border-l border-white/30 bg-ink px-2 font-mono text-[10px] font-bold text-white transition-colors hover:text-green-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <span aria-hidden>{paused ? "▶" : "❚❚"}</span>
      </button>
    </div>
  );
}

function TickerEntry({ label, href }: { label: string; href: string | null }) {
  const body = (
    <>
      {href ? (
        <span className="transition-colors hover:text-green-400">{label}</span>
      ) : (
        <span>{label}</span>
      )}
    </>
  );

  return (
    <>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center py-1"
        >
          {body}
        </a>
      ) : (
        <div className="flex shrink-0 items-center gap-3 py-1">
          <span className="inline-block h-2 w-2 animate-ping rounded-full bg-green-400" />
          {body}
        </div>
      )}
      <span className="shrink-0">✦</span>
    </>
  );
}
