"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef } from "react";

interface CountUpProps {
  /** Target value. */
  to: number;
  /** Seconds for the full count. */
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

// useLayoutEffect warns when a component is server-rendered, so fall back to
// useEffect on the server. On the client this runs before the first paint.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Counts from 0 up to `to`, the first time the element scrolls into view.
 *
 * The server renders the real figure, and the count runs downhill from it, so a
 * failed hydration or a missed viewport callback leaves the correct number on
 * the page instead of a zero. Writing into the DOM node rather than React state
 * keeps a 1.6s count to a single render instead of ~90.
 *
 * If the element is already on screen at mount, the reset to 0 happens in a
 * layout effect, so the finished value is never painted and then yanked back.
 */
export function CountUp({
  to,
  duration = 1.6,
  className = "",
  prefix = "",
  suffix = "",
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const still = useReducedMotion();

  const final = `${prefix}${to.toLocaleString("id-ID")}${suffix}`;

  useIsoLayoutEffect(() => {
    const node = ref.current;
    if (!node || !inView || still) return;

    node.textContent = `${prefix}0${suffix}`;
    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (value) => {
        node.textContent = `${prefix}${Math.round(value).toLocaleString("id-ID")}${suffix}`;
      },
    });

    return () => {
      controls.stop();
      node.textContent = final;
    };
  }, [inView, to, duration, still, prefix, suffix, final]);

  return (
    <span ref={ref} className={className}>
      {final}
    </span>
  );
}