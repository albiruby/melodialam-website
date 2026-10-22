"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Replaces the original `.reveal-section` + IntersectionObserver pair from the
 * single-file page. Each child animates in once when it crosses the viewport.
 *
 * The reduced-motion check runs in an effect callback rather than inline so the
 * render itself never calls setState.
 */
export function Reveal({
  children,
  as: Tag = "section",
  className = "",
}: {
  children: React.ReactNode;
  as?: "section" | "div" | "article";
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let observer: IntersectionObserver | undefined;

    // Defer past the first paint so this reads as a subscription, not a write.
    const id = requestAnimationFrame(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setVisible(true);
        return;
      }
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setVisible(true);
              observer?.disconnect();
            }
          }
        },
        { threshold: 0.08 },
      );
      observer.observe(node);
    });

    return () => {
      cancelAnimationFrame(id);
      observer?.disconnect();
    };
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`reveal-section ${visible ? "is-visible" : ""} ${className}`.trim()}
    >
      {children}
    </Tag>
  );
}