"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";

interface ParallaxImageProps {
  src: string;
  alt: string;
  /**
   * Styling for the frame. It needs a size (an aspect class works), and
   * `relative overflow-hidden` is added for you.
   */
  className?: string;
  /** Extra classes for the <img> itself, e.g. a grayscale hover transition. */
  imageClassName?: string;
  sizes?: string;
  /** Total travel in px across the pass-through. */
  distance?: number;
  /**
   * Set on the LCP image only. Next 16 deprecated `priority` in favour of
   * `preload`, which is the right lever for a single hero image.
   */
  preload?: boolean;
}

/** Headroom beyond the travel, so spring overshoot never exposes an edge. */
const EDGE_HEADROOM = 32;

/**
 * Scroll-linked parallax for editorial imagery. The frame stays where the layout
 * put it and the image inside travels, so the page never gains height and the
 * scroll position is never hijacked.
 *
 * The image box is made taller than the frame by `distance + headroom` on each
 * edge rather than being CSS-scaled. That distinction matters: `transform:
 * scale()` makes the browser rasterise the photo at layout size and then upscale
 * the bitmap, which visibly softens it — measured at 1.22x overscan the hero was
 * serving 1328px of image into 1581px of render (a 1.45x upscale), and `sizes`
 * could not describe it because the scale factor is invisible to srcset. With an
 * oversized box the rendered width equals the frame width, so `sizes` stays
 * exact and the photo lands at 1:1.
 *
 * When the OS asks for reduced motion the travel is dropped entirely, which is
 * what Motion's docs recommend for scroll-derived values.
 */
export function ParallaxImage({
  src,
  alt,
  className = "",
  imageClassName = "object-cover",
  sizes = "100vw",
  distance = 48,
  preload = false,
}: ParallaxImageProps) {
  const frame = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: frame,
    offset: ["start end", "end start"],
  });

  // Spring-smooth the raw progress so travel does not jitter on wheel steps.
  const progress = useSpring(scrollYProgress, { stiffness: 150, damping: 30, mass: 0.4 });
  const y = useTransform(progress, [0, 1], [distance, -distance]);

  const bleed = distance + EDGE_HEADROOM;

  return (
    <div ref={frame} className={`relative overflow-hidden ${className}`.trim()}>
      <motion.div
        className="absolute inset-x-0"
        style={still ? { top: 0, bottom: 0 } : { top: -bleed, bottom: -bleed, y }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          preload={preload}
          className={imageClassName}
        />
      </motion.div>
    </div>
  );
}