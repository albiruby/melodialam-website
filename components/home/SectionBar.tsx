import Link from "next/link";

/**
 * The small section bar used on The homepage.
 *
 * A number, a label, and one way out. The heading is deliberately small: on
 * this page the photographs and the lead story carry the hierarchy, and a row
 * of four large section titles would make every block shout at the same volume.
 * The `h2` stays real for structure and screen readers; it is just quiet.
 *
 * No arrow glyph: the link is underlined, which reads as an action without the
 * decorative ↗ the site retired from its CTAs.
 */
export function SectionBar({
  id,
  label,
  href,
  linkLabel,
  tone = "light",
}: {
  /** Set when a surrounding <section> points at this heading. */
  id?: string;
  /** Small uppercase section name. */
  label: string;
  href?: string;
  linkLabel?: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";

  return (
    <div
      className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b pb-3 ${
        dark ? "border-white/20" : "border-rule"
      }`}
    >
      <h2
        id={id}
        className={`font-sans text-[11px] font-bold uppercase tracking-[0.18em] ${
          dark ? "text-white" : "text-ink"
        }`}
      >
        {label}
      </h2>

      {href && linkLabel ? (
        <Link
          href={href}
          className={`inline-flex min-h-11 items-center font-sans text-[10px] font-bold uppercase tracking-[0.14em] underline decoration-1 underline-offset-4 transition-colors ${
            dark
              ? "text-white/70 hover:text-white focus-visible:outline-white"
              : "text-neutral-600 hover:text-ink focus-visible:outline-forest"
          }`}
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
