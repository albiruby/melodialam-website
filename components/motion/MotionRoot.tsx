"use client";

import { MotionConfig } from "motion/react";

/**
 * One global lever for motion accessibility.
 *
 * `reducedMotion="user"` makes Motion drop transform and layout animations —
 * keeping opacity fades — whenever the OS asks for reduced motion, so
 * individual components do not each need their own guard.
 *
 * Scroll-linked values are the exception: they are `style` motion values rather
 * than animations, so components that derive them check `useReducedMotion`
 * themselves.
 */
export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}