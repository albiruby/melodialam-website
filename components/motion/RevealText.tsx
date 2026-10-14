"use client";

import { motion } from "motion/react";
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";

interface RevealTextProps {
  text: string;
  className?: string;
  /** Seconds before the first word moves. */
  delay?: number;
  /** Seconds between consecutive words. */
  stagger?: number;
}

/**
 * Descender room. Each word sits in an `overflow-hidden` box, and without this
 * the box shears the tails off g, y, j, p and q. The matching negative margin
 * cancels the padding so line height is unchanged.
 */
const DESCENDER_ROOM = "0.18em";

/** How far down the viewport a heading must reach before it plays. */
const TRIGGER_AT = 0.9;

// useLayoutEffect warns when a component is server-rendered, so fall back to
// useEffect on the server. On the client this runs before the first paint.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Editorial masked reveal: every word sits in its own clipping box and slides up
 * from below it, staggered left to right.
 *
 * The mask is armed on the client and never in the server HTML. That ordering is
 * deliberate: the rendered markup holds the finished, legible heading, so the
 * text survives a failed hydration, a crawler that does not run scripts, and
 * anyone with JS off. The animation only ever takes it away and puts it back.
 * (The earlier version baked `translateY(115%)` into the SSR output, which meant
 * one missed viewport callback left the heading permanently invisible.)
 *
 * The trigger is a direct rect read on mount, scroll and resize rather than an
 * IntersectionObserver callback, because the reveal must not depend on a
 * callback we cannot verify ran.
 *
 * The boxes are `inline-block` and the spaces between them are real text nodes,
 * so the heading still wraps exactly as it would as plain text.
 */
export function RevealText({
  text,
  className = "",
  delay = 0,
  stagger = 0.055,
}: RevealTextProps) {
  const host = useRef<HTMLSpanElement>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  // Arm before paint, so the mask is never visible as a flash of the finished
  // state jumping backwards.
  useIsoLayoutEffect(() => {
    setArmed(true);
  }, []);

  useEffect(() => {
    const node = host.current;
    if (!node) return;

    let done = false;
    const check = () => {
      if (done) return;
      const r = node.getBoundingClientRect();
      if (r.top < window.innerHeight * TRIGGER_AT && r.bottom > 0) {
        done = true;
        setShown(true);
        window.removeEventListener("scroll", check);
        window.removeEventListener("resize", check);
      }
    };

    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check, { passive: true });
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  const words = text.split(" ").filter(Boolean);
  const masked = armed && !shown;

  return (
    <span ref={host} className={className}>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span
            className="inline-block overflow-hidden align-bottom"
            style={{ paddingBottom: DESCENDER_ROOM, marginBottom: `-${DESCENDER_ROOM}` }}
          >
            <motion.span
              className="inline-block"
              // initial={false} keeps Motion from writing a hidden state into the
              // markup; the value only changes once `masked` flips on the client.
              initial={false}
              animate={{ y: masked ? "115%" : "0%" }}
              transition={{
                duration: 0.8,
                delay: delay + i * stagger,
                // Matches --ease-editorial so the type matches the rest of the page.
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}