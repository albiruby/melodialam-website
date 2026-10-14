"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ARTICLE_CATEGORIES, ARTICLES, CATEGORY_LABELS, type ArticleCategory } from "@/lib/content";
import { ArticleCard } from "@/components/ArticleCards";

export function JournalBrowser() {
  const [category, setCategory] = useState<ArticleCategory | "all">("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: ARTICLES.length };
    for (const cat of ARTICLE_CATEGORIES) {
      map[cat] = ARTICLES.filter((a) => a.category === cat).length;
    }
    return map;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ARTICLES.filter((a) => {
      const matchesCategory = category === "all" || a.category === category;
      const matchesQuery =
        q === "" ||
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  const options: { value: ArticleCategory | "all"; label: string; count: number }[] = [
    { value: "all", label: "All Articles", count: counts.all },
    ...ARTICLE_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c], count: counts[c] })),
  ];

  return (
    <>
      {/* Hierarchy header + filters */}
      <div className="grid grid-cols-1 items-start border-b border-ink pb-8 md:grid-cols-12">
        <div className="flex flex-col items-start text-4xl leading-[1.08] tracking-tight sm:text-6xl md:col-span-7">
          <Link href="/" className="dash-reveal-item text-neutral-400 transition-colors duration-300 hover:text-forest">
            <span className="dash-reveal-prefix" aria-hidden="true">
              —
            </span>
            <span>Home</span>
          </Link>
          <div className="dash-reveal-item text-forest">
            <span className="dash-reveal-prefix" aria-hidden="true">
              —
            </span>
            <span>{category === "all" ? "Journal" : CATEGORY_LABELS[category]}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-start space-y-1.5 text-lg leading-snug sm:text-xl md:col-span-5 md:mt-2">
          {options.map((opt) => {
            const active = category === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCategory(opt.value)}
                aria-pressed={active}
                className={`dash-reveal-item text-left font-medium transition-all duration-300 ${
                  active ? "text-neutral-400" : "text-ink hover:text-forest"
                }`}
              >
                <span className="dash-reveal-prefix" aria-hidden="true">
                  —
                </span>
                <span>
                  {opt.label} ({opt.count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-4 border-b border-ink py-3">
        <label htmlFor="journal-search" className="sr-only">
          Cari artikel
        </label>
        <input
          id="journal-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari artikel, musisi, atau rubrik..."
          className="w-full max-w-sm border-b border-ink bg-transparent py-1 text-xs outline-none transition-colors placeholder:text-neutral-500 focus:border-forest"
        />
        <span className="font-mono text-[11px] text-neutral-500">
          {filtered.length} / {ARTICLES.length} artikel
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-8 border-b border-ink pb-10 pt-8 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.length === 0 ? (
          <div className="stagger-item editorial-paper col-span-full border border-dashed border-ink py-12 text-center">
            <p className="text-lg font-bold">
              Tidak ada artikel yang cocok dengan pencarian &ldquo;{query}&rdquo;
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
              className="mt-3 font-mono text-xs uppercase underline"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          filtered.map((article, i) => (
            <div key={article.slug} className="relative">
              <ArticleCard article={article} titleFirst={i % 2 === 1} index={i} />
            </div>
          ))
        )}
      </div>
    </>
  );
}