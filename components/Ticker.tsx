import Link from "next/link";
import type { TickerItem } from "@/lib/site-settings";
import { MarqueeTape } from "./motion/MarqueeTape";

/**
 * Infinite ticker. `MarqueeTape` owns the loop and duplicates the entries, so
 * the scroll-velocity coupling stays seamless.
 *
 * The items come from the `siteSettings` singleton, handed down by the layout:
 * this component sits inside `MotionRoot`, which is a client boundary, so it
 * cannot read the CMS itself.
 */
export function Ticker({ items }: { items: TickerItem[] }) {
  const run = items.map((item, i) => (
    <TickerEntry key={i} label={item.label} href={item.href} />
  ));

  return (
    <div className="overflow-hidden border-b border-ink bg-ink py-2 text-[11px] uppercase tracking-widest text-white">
      <MarqueeTape>{run}</MarqueeTape>
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
        <a href={href} target="_blank" rel="noreferrer" className="shrink-0">
          {body}
        </a>
      ) : (
        <div className="flex shrink-0 items-center gap-3">
          <span className="inline-block h-2 w-2 animate-ping rounded-full bg-green-400" />
          {body}
        </div>
      )}
      <span className="shrink-0">✦</span>
    </>
  );
}

/** Small helper so other sections can link straight to the demo form. */
export function SubmitLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/submit"
      className={`bg-forest px-3.5 py-1.5 font-bold text-white transition-all duration-300 hover:bg-ink hover:translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#0D0D0D] ${className}`.trim()}
    >
      Submit Demo ↗
    </Link>
  );
}