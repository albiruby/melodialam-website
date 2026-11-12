"use client";

import Image from "next/image";
import { useMemo, useSyncExternalStore } from "react";
import {
  PILLAR_LABELS,
  PHOTO_PILLARS,
  REEL_PILLARS,
  coverFit,
  pillarDate,
  type PillarPost,
} from "@/lib/pillars-shared";

/**
 * The Discover wall, arranged like a newspaper section page.
 *
 * Every pillar gets a centred section head, a rule, and a four-column grid.
 * The page is still the same archive — all posts stay on the page, in
 * reverse-chronological order, and the section head can narrow the view to one
 * pillar. Search and the pillar index write to the URL, so a filtered view can
 * be shared and survives a reload.
 *
 * The reference look is a print page: a nameplate at the top, centred section
 * titles, and cards that lead with the photograph. The site's own type and
 * rules carry it; no extra palette or ornament is introduced.
 */

const URL_EVENT = "melodi:discover-url";
const PILLAR_ORDER = [...PHOTO_PILLARS, ...REEL_PILLARS];
const KNOWN_PILLARS = new Set(["all", ...PILLAR_ORDER]);

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

  const matched = useMemo(
    () =>
      posts
        .filter((post) => {
          if (pillar !== "all" && post.pillar !== pillar) return false;
          if (!q) return true;
          const label = PILLAR_LABELS[post.pillar] ?? post.pillar;
          return (
            post.title.toLowerCase().includes(q) || label.toLowerCase().includes(q)
          );
        })
        .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")),
    [posts, q, pillar],
  );

  /**
   * Sections keep the editorial pillar order. A post with a pillar the site
   * does not know yet still gets a home in a final "Lainnya" group rather than
   * disappearing from the page.
   */
  const groups = useMemo(() => {
    const known = PILLAR_ORDER.map((key) => ({
      key,
      label: PILLAR_LABELS[key] ?? key,
      posts: matched.filter((post) => post.pillar === key),
    })).filter((group) => group.posts.length > 0);

    const other = matched.filter((post) => !PILLAR_ORDER.includes(post.pillar));
    if (other.length > 0) {
      known.push({ key: "lainnya", label: "Lainnya", posts: other });
    }

    return known;
  }, [matched]);

  const chips = ["all", ...PILLAR_ORDER]
    .map((key) => ({
      key,
      label: key === "all" ? "Semua" : (PILLAR_LABELS[key] ?? key),
      count:
        key === "all"
          ? posts.length
          : posts.filter((post) => post.pillar === key).length,
    }))
    .filter((chip) => chip.key === "all" || chip.count > 0);

  return (
    <>
      {/* Nameplate */}
      <header className="border-b-2 border-ink py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-600">
          <span>Feed @melodi.alam</span>
          <span>
            {posts.length} post · {new Set(posts.map((post) => post.pillar)).size} pillar
          </span>
        </div>
        <h1 className="mt-2 text-center font-display text-5xl font-black uppercase leading-none tracking-tight text-ink sm:text-7xl">
          Discover
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-center font-sans text-[10px] uppercase leading-relaxed tracking-[0.12em] text-neutral-600">
          Fakta musik · Lirik · Trivia · Kutipan · Rekomendasi · Ulasan · Clipper
        </p>
      </header>

      {/* Search + pillar index */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 py-3">
        <label htmlFor="discover-search" className="sr-only">
          Cari post di Discover
        </label>
        <input
          id="discover-search"
          type="search"
          value={query}
          onChange={(event) => setUrl(event.target.value, pillar)}
          placeholder="Cari judul atau pillar…"
          className="w-full max-w-xs border-b border-ink bg-transparent py-2 text-xs outline-none transition-colors placeholder:text-neutral-600 focus:border-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        />
        <span
          aria-live="polite"
          className="font-sans text-[10px] uppercase tracking-[0.12em] text-neutral-600"
        >
          {matched.length} dari {posts.length} post
        </span>
      </div>

      <nav
        aria-label="Filter pillar"
        className="no-scrollbar flex gap-x-5 gap-y-1 overflow-x-auto py-2 sm:flex-wrap sm:overflow-visible"
      >
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => setUrl(query, chip.key)}
            aria-pressed={pillar === chip.key}
            className={`inline-flex min-h-9 shrink-0 items-center whitespace-nowrap font-sans text-[10px] font-bold uppercase tracking-[0.14em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest ${
              pillar === chip.key
                ? "text-forest underline decoration-2 underline-offset-4"
                : "text-neutral-600 hover:text-ink"
            }`}
          >
            {chip.label} ({chip.count})
          </button>
        ))}
      </nav>

      {groups.length > 0 ? (
        <div className="mt-10 space-y-14">
          {groups.map((group, groupIndex) => {
            const isolated = pillar === group.key;
            return (
              <section key={group.key} aria-labelledby={`pillar-${group.key}`}>
                <div className="relative border-b-2 border-ink pb-3 text-center">
                  <h2
                    id={`pillar-${group.key}`}
                    className="text-balance font-display text-3xl font-black uppercase leading-none tracking-tight text-ink sm:text-4xl md:text-5xl"
                  >
                    {group.label}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setUrl(query, isolated ? "all" : group.key)}
                    aria-label={
                      isolated
                        ? "Tampilkan semua pillar"
                        : `Tampilkan hanya ${group.label}`
                    }
                    className="mt-2 inline-flex min-h-9 items-center font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-600 underline decoration-1 underline-offset-4 transition-colors hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest sm:absolute sm:bottom-3 sm:right-0 sm:mt-0"
                  >
                    {isolated ? "Semua pillar" : "Lihat semua"}{" "}
                    <span aria-hidden className="ml-1">→</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-10 pt-6 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
                  {group.posts.map((post, index) => (
                    <DiscoverCard
                      key={post.id}
                      post={post}
                      eager={groupIndex === 0 && index < 4}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <p className="py-16 text-center text-sm text-neutral-600">
          Belum ada post yang cocok. Coba kata kunci lain atau pilih “Semua”.
        </p>
      )}
    </>
  );
}

/** One newspaper card: photograph first, headline, then the smallest meta line. */
function DiscoverCard({ post, eager = false }: { post: PillarPost; eager?: boolean }) {
  return (
    <a
      href={post.igUrl}
      target="_blank"
      rel="noreferrer"
      className="group flex h-full flex-col"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
        {post.image ? (
          <Image
            src={post.image}
            alt=""
            fill
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "auto"}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
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

      <h3 className="mt-3 line-clamp-4 font-display text-base font-bold leading-[1.15] tracking-tight text-ink transition-colors group-hover:text-forest sm:text-lg">
        {post.title}
      </h3>

      <div className="mt-auto pt-3">
        <div className="flex items-baseline justify-between gap-2 pt-2 font-sans text-[9px] uppercase tracking-[0.12em] text-neutral-600">
          <span>{pillarDate(post.date)}</span>
          <span>{post.mediaType === "reel" ? "Reel" : "Foto"}</span>
        </div>
      </div>
    </a>
  );
}
