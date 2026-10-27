"use client";

import { useMemo, useSyncExternalStore } from "react";
import { PillarCard } from "./PillarCards";
import { PillarHead } from "./PillarHead";
import { PILLAR_LABELS, PHOTO_PILLARS, REEL_PILLARS, type PillarPost } from "@/lib/pillars-shared";

/**
 * The curated pool, searchable.
 *
 * Without a filter the page reads as before — the six newest posts of each
 * pillar. A search or a pillar chip lifts the six-post cap and searches the
 * whole pool, then drops the sections that no longer have anything in them.
 *
 * The URL is the source of truth for the filter and the query, so a filtered
 * view can be shared and survives a reload. `useSyncExternalStore` keeps the
 * server render (all posts, good for SEO) and the client URL in sync without a
 * setState-in-effect.
 */

const PILLAR_LIMIT = 6;
/** A search can return a lot; this keeps one screen from becoming the list. */
const SEARCH_LIMIT = 48;

const URL_EVENT = "melodi:kurasi-url";
const KNOWN_PILLARS = new Set(["all", ...PHOTO_PILLARS, ...REEL_PILLARS]);

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener(URL_EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(URL_EVENT, callback);
  };
}

const getSearch = () => window.location.search;
const getServerSearch = () => "";

export function KurasiBrowser({ posts }: { posts: PillarPost[] }) {
  const search = useSyncExternalStore(subscribe, getSearch, getServerSearch);
  const params = useMemo(() => new URLSearchParams(search), [search]);

  const query = params.get("q") ?? "";
  const requested = params.get("pillar") ?? "all";
  const pillar = KNOWN_PILLARS.has(requested) ? requested : "all";

  const setUrl = (nextQuery: string, nextPillar: string) => {
    const next = new URLSearchParams();
    const trimmed = nextQuery.trim();
    if (trimmed) next.set("q", trimmed);
    if (nextPillar !== "all") next.set("pillar", nextPillar);
    const qs = next.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${qs ? `?${qs}` : ""}`,
    );
    window.dispatchEvent(new Event(URL_EVENT));
  };

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
          onChange={(event) => setUrl(event.target.value, pillar)}
          placeholder="Cari judul atau pillar…"
          className="w-full max-w-sm border-b border-ink bg-transparent py-2 text-xs outline-none transition-colors placeholder:text-neutral-600 focus:border-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        />
        <span className="font-mono text-[11px] uppercase text-neutral-600">
          {filtering ? `${matched.length} dari ${posts.length} post` : `${posts.length} post kurasi`}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-ink py-3">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => setUrl(query, chip.key)}
            aria-pressed={pillar === chip.key}
            className={`min-h-9 border border-ink px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
              pillar === chip.key ? "bg-ink text-white" : "hover:bg-paper"
            }`}
          >
            {chip.label} ({chip.count})
          </button>
        ))}
      </div>

      {readPillars.length > 0 ? (
        <div className="pt-8">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-600">
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
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-600">
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
        <p className="py-16 text-center text-sm text-neutral-600">
          Belum ada post yang cocok. Coba kata kunci lain atau pilih “Semua”.
        </p>
      ) : null}
    </>
  );
}
