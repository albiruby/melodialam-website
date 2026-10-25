"use client";

import { useMemo, useState } from "react";
import { PillarCard } from "./PillarCards";
import { PillarHead } from "./PillarHead";
import { PILLAR_LABELS, PHOTO_PILLARS, REEL_PILLARS, type PillarPost } from "@/lib/pillars-shared";

/**
 * The curated pool, searchable.
 *
 * Without a filter the page reads as before — the six newest posts of each
 * pillar. A search or a pillar chip lifts the six-post cap and searches the
 * whole pool, then drops the sections that no longer have anything in them.
 */

const PILLAR_LIMIT = 6;
/** A search can return a lot; this keeps one screen from becoming the list. */
const SEARCH_LIMIT = 48;

export function KurasiBrowser({ posts }: { posts: PillarPost[] }) {
  const [query, setQuery] = useState("");
  const [pillar, setPillar] = useState<string>("all");

  const q = query.trim().toLowerCase();
  const filtering = q.length > 0 || pillar !== "all";

  const matches = (post: PillarPost) => {
    if (pillar !== "all" && post.pillar !== pillar) return false;
    if (!q) return true;
    const label = PILLAR_LABELS[post.pillar] ?? post.pillar;
    return post.title.toLowerCase().includes(q) || label.toLowerCase().includes(q);
  };

  const matched = useMemo(
    () => posts.filter((post) => matches(post)),
    // `matches` closes over `q` and `pillar`, which are the real inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [posts, q, pillar],
  );

  const group = (keys: string[]) =>
    keys
      .map((key) => {
        const pool = matched.filter((post) => post.pillar === key);
        return {
          key,
          label: PILLAR_LABELS[key] ?? key,
          pool: filtering ? pool.slice(0, SEARCH_LIMIT) : pool.slice(0, PILLAR_LIMIT),
        };
      })
      .filter((section) => section.pool.length > 0);

  const readPillars = group(PHOTO_PILLARS);
  const watchPillars = group(REEL_PILLARS);

  const chips = ["all", ...new Set([...PHOTO_PILLARS, ...REEL_PILLARS])]
    .map((key) => ({
      key,
      label: key === "all" ? "Semua" : (PILLAR_LABELS[key] ?? key),
      count: key === "all" ? posts.length : posts.filter((post) => post.pillar === key).length,
    }))
    .filter((chip) => chip.key === "all" || chip.count > 0);

  return (
    <>
      {/* Search + filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink py-3">
        <label htmlFor="kurasi-search" className="sr-only">
          Cari post kurasi
        </label>
        <input
          id="kurasi-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari judul atau pillar…"
          className="w-full max-w-sm border-b border-ink bg-transparent py-1 text-xs outline-none transition-colors placeholder:text-neutral-500 focus:border-forest"
        />
        <span className="font-mono text-[11px] uppercase text-neutral-500">
          {filtering ? `${matched.length} dari ${posts.length} post` : `${posts.length} post kurasi`}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-ink py-3">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => setPillar(chip.key)}
            aria-pressed={pillar === chip.key}
            className={`border border-ink px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
              pillar === chip.key ? "bg-ink text-white" : "hover:bg-paper"
            }`}
          >
            {chip.label} ({chip.count})
          </button>
        ))}
      </div>

      {readPillars.length > 0 ? (
        <div className="pt-8">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-500">
            Baca — dari feed @melodi.alam
          </span>
          {readPillars.map((section) => (
            <section key={section.key} id={section.key} className="pt-6">
              <PillarHead label={section.label} note={`${section.pool.length} post kurasi`} />
              <div className="grid grid-cols-2 gap-5 pt-5 sm:grid-cols-3 lg:grid-cols-6">
                {section.pool.map((post) => (
                  <PillarCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {watchPillars.length > 0 ? (
        <div className="pt-12">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-500">
            Tonton — dari feed @melodi.alam
          </span>
          {watchPillars.map((section) => (
            <section key={section.key} id={section.key} className="pt-6">
              <PillarHead label={section.label} note={`${section.pool.length} post kurasi`} />
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
                {section.pool.map((post) => (
                  <PillarCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {readPillars.length === 0 && watchPillars.length === 0 ? (
        <p className="py-16 text-center text-sm text-neutral-500">
          Belum ada post yang cocok. Coba kata kunci lain atau pilih “Semua”.
        </p>
      ) : null}
    </>
  );
}
