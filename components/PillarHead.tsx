/** Section head shared by both pages' "Dari Feed" pillar bands. */
export function PillarHead({ label, note }: { label: string; note: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-ink pb-3">
      <div className="flex items-baseline gap-4">
        <h3 className="font-display text-3xl font-black uppercase leading-none tracking-tight sm:text-4xl">
          {label}
        </h3>
        <span className="font-mono text-[11px] uppercase text-neutral-500">{note}</span>
      </div>
      <a
        href="https://www.instagram.com/melodi.alam/"
        target="_blank"
        rel="noreferrer"
        className="nav-link-anim font-mono text-xs font-bold uppercase tracking-wider transition-colors hover:text-forest"
      >
        @melodi.alam ↗
      </a>
    </div>
  );
}
