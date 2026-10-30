"use client";

import Image from "next/image";
import { useMemo, useSyncExternalStore } from "react";
import {
  PILLAR_LABELS,
  PHOTO_PILLARS,
  REEL_PILLARS,
  coverFit,
  type PillarPost,
} from "@/lib/pillars-shared";

/**
 * The Discover grid, searchable.
 *
 * A flat, reverse-chronological wall of 4:5 covers: date above, title and
 * pillar below. The pillar chips and the search are the only chrome — no
 * section headings — so the grid keeps one rhythm from the first row to the
 * last.
 *
 * The URL is the source of truth for the filter and the query, so a filtered
 * view can be shared and survives a reload. `useSyncExternalStore` keeps the
 * server render (all posts, good for SEO) and the client URL in sync without a
 * setState-in-effect.
 */

const URL_EVENT = "melodi:discover-url";
const KNOWN_PILLARS = new Set(["all", ...PHOTO_PILLARS, ...REEL_PILLARS]);

/** "2026-03-04" -> "4.3.26" — the compact date above each tile. */
function tileDate(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  return `${d}.${m}.${String(y).slice(-2)}`;
}

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

export function DiscoverBrowser({ posts }: { posts: PillarPost[] }) {
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

  const matches = (post: PillarPost) => {
    if (pillar !== "all" && post.pillar !== pillar) return false;
    if (!q) return true;
    const label = PILLAR_LABELS[post.pillar] ?? post.pillar;
    return post.title.toLowerCase().includes(q) || label.toLowerCase().includes(q);
  };

  const matched = useMemo(
    () =>
      posts
        .filter((post) => matches(post))
        .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")),
    // `matches` closes over `q` and `pillar`, which are the real inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [posts, q, pillar],
  );

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
      <div className="flex flex-wrap items-center gap-3 border-b border-rule py-3">
        <label htmlFor="discover-search" className="sr-only">
          Cari post di Discover
        </label>
        <input
          id="discover-search"
          type="search"
          value={query}
          onChange={(event) => setUrl(event.target.value, pillar)}
          placeholder="Cari judul atau pillar…"
          className="w-full max-w-sm border-b border-ink bg-transparent py-2 text-xs outline-none transition-colors placeholder:text-neutral-600 focus:border-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-rule py-3 sm:flex-wrap sm:overflow-visible">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => setUrl(query, chip.key)}
            aria-pressed={pillar === chip.key}
            className={`min-h-9 shrink-0 border border-ink px-3 py-2 font-sans text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
              pillar === chip.key ? "bg-ink text-white" : "hover:bg-paper"
            }`}
          >
            {chip.label} ({chip.count})
          </button>
        ))}
      </div>

      {matched.length > 0 ? (
        <section aria-labelledby="discover-grid-title">
          <h2 id="discover-grid-title" className="sr-only">
            Post Discover
          </h2>
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 pt-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {matched.map((post) => (
              <a
                key={post.id}
                href={post.igUrl}
                target="_blank"
                rel="noreferrer"
                className="group block"
              >
                <p className="text-right font-display text-xl font-bold leading-none tracking-tight text-ink tabular-nums sm:text-2xl">
                  {tileDate(post.date)}
                </p>

                <div className="relative mt-2 aspect-[4/5] overflow-hidden border border-rule bg-neutral-100 shadow-[3px_3px_0_var(--color-rule)]">
                  {post.image ? (
                    <Image
                      src={post.image}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
                      className={`editorial-img ${
                      coverFit(post) === "contain" ? "object-contain" : "object-cover"
                    }`}
                    />
                  ) : null}
                  {post.mediaType === "reel" ? (
                    <span className="absolute right-2 top-2 bg-white px-1.5 py-0.5 font-sans text-[10px] font-bold uppercase text-ink">
                      Reel
                    </span>
                  ) : null}
                </div>

                <h3 className="mt-3 line-clamp-4 font-sans text-[11px] font-bold uppercase leading-[1.35] tracking-wide text-ink transition-colors group-hover:text-forest">
                  {post.title}
                </h3>
                <p className="mt-1 font-sans text-[10px] uppercase tracking-wide text-neutral-500">
                  {PILLAR_LABELS[post.pillar] ?? post.pillar}
                </p>
              </a>
            ))}
          </div>
        </section>
      ) : (
        <p className="py-16 text-center text-sm text-neutral-600">
          Belum ada post yang cocok. Coba kata kunci lain atau pilih “Semua”.
        </p>
      )}
    </>
  );
}
