"use client";

import { useEffect, useState } from "react";

/** Thin forest-coloured bar tracking document scroll, as in the original. */
export function ScrollProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const scrollTop = window.scrollY;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setPct(scrollable > 0 ? Math.min(100, (scrollTop / scrollable) * 100) : 0);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed top-0 left-0 z-50 h-1 w-full bg-transparent">
      <div
        className="h-full bg-forest transition-[width] duration-150 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}