"use client";

import { motion, useAnimationFrame, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useVelocity } from "motion/react";
import { useEffect, useRef } from "react";

/** Tape speed at rest, px per second. */
const BASE_SPEED = 62;

/** How much of the scroll velocity is folded into the tape. */
const VELOCITY_SCALE = 0.5;

/**
 * An infinite marquee driven by Motion instead of a CSS keyframe, so its speed
 * can be coupled to scroll velocity: throw the page and the tape accelerates,
 * throw it the other way and the tape reverses, then it eases back to a drift.
 *
 * Deliberately not a skew — skewing a full-width strip displaces its edges by
 * tan(angle) x halfWidth (~100px at 8deg on a 1440px page), which tears the
 * strip apart rather than leaning it.
 *
 * Children are rendered twice so the wrap point is invisible; the component
 * owns that duplication because the wrap maths depends on the two halves being
 * identical.
 *
 * Performance notes, both load-bearing:
 *  - The loop width is measured by a ResizeObserver, not read per frame.
 *    Reading `scrollWidth` inside the frame callback forces a synchronous
 *    reflow on the same frame that Motion writes `transform`, which thrashes
 *    layout badly enough to starve the whole page's rAF (measured: 1 frame/s).
 *  - The tape idles whenever it is scrolled out of view, since it lives in the
 *    masthead and is invisible for most of a visit.
 */
export function MarqueeTape({ children }: { children: React.ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const hovered = useRef(false);
  const half = useRef(0);
  const x = useMotionValue(0);

  const still = useReducedMotion();
  const inView = useInView(track);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);

  // Spring-smooth the raw velocity so speed ramps instead of snapping.
  const boost = useSpring(velocity, { stiffness: 240, damping: 48, mass: 0.6 });

  // Measure off the frame loop: on mount and whenever the track resizes.
  useEffect(() => {
    const node = track.current;
    if (!node) return;

    const measure = () => {
      half.current = node.scrollWidth / 2;
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    // `still` and out-of-view are cheap early exits so the page keeps its frames.
    if (still || hovered.current || !inView) return;

    const loop = half.current;
    if (loop <= 0) return;

    // delta is milliseconds, so this yields px/s.
    const speed = BASE_SPEED + boost.get() * VELOCITY_SCALE;
    let next = x.get() - (speed * delta) / 1000;

    // Wrap in both directions: a fast reverse must not walk off the end.
    if (next <= -loop) next += loop;
    if (next > 0) next -= loop;

    x.set(next);
  });

  return (
    <motion.div
      ref={track}
      /*
        The style object is always present, even under reduced motion. Branching
        it to `undefined` produced different markup on the server (which cannot
        know the user's motion preference) and on the client, which React reports
        as a hydration mismatch. Under reduced motion the frame loop below simply
        never advances `x`, so the tape stays still.
      */
      style={{ x }}
      className="flex w-max will-change-transform"
      onMouseEnter={() => {
        hovered.current = true;
      }}
      onMouseLeave={() => {
        hovered.current = false;
      }}
    >
      <div className="flex shrink-0 items-center gap-10 pr-10">{children}</div>
      <div aria-hidden className="flex shrink-0 items-center gap-10 pr-10">
        {children}
      </div>
    </motion.div>
  );
}