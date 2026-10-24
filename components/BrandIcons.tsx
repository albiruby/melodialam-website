/**
 * The three channel marks, drawn inline.
 *
 * Inline SVG rather than files: they inherit `currentColor`, so the same mark
 * works in the header (ink on paper) and inside a button that turns white on
 * hover, without a second asset for each state. Each is decorative — the link
 * around it carries the accessible name — so every one of them is
 * `aria-hidden`.
 */

type IconProps = {
  className?: string;
};

/** Instagram: the rounded frame, the lens, the dot. */
export function InstagramIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** YouTube: the screen and the play mark. */
export function YoutubeIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10.2 9.4v5.2l4.6-2.6z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** TikTok: the note — a stem, a hook, and the circle at its foot. */
export function TiktokIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M14 3.2v9.4a3.9 3.9 0 1 1-3.1-3.8" />
      <path d="M14 3.2c.4 2.2 1.9 3.6 4.1 3.8" />
    </svg>
  );
}
