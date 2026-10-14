"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Stand-in for the original YouTube-iframe overlay. Rendered once and shared
 * by every page that needs a "watch" affordance.
 *
 * Mount it with <VideoModal /> and open it imperatively through
 * window.dispatchEvent(new CustomEvent("melodi:watch", { detail: { id, title } })).
 */
export function VideoModal() {
  const [state, setState] = useState<{ id: string; title: string } | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    setState(null);
    // Give the exit transition time to finish before the iframe unmounts.
    closeTimer.current = setTimeout(() => setState(null), 350);
  }, []);

  const open = useCallback((event: Event) => {
    const detail = (event as CustomEvent<{ id: string; title: string }>).detail;
    if (!detail?.id) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setState({ id: detail.id, title: detail.title ?? "Melodi Alam" });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("melodi:watch", open);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("melodi:watch", open);
      window.removeEventListener("keydown", onKey);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [open, close]);

  if (!state) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={state.title}
      className="modal-backdrop is-open fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal-panel w-full max-w-4xl border-2 border-ink bg-white shadow-[10px_10px_0px_#1B3B2B]">
        <div className="flex items-center justify-between border-b border-ink bg-paper px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
            <h2 className="max-w-md truncate font-mono text-xs font-bold uppercase sm:max-w-xl">
              {state.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="border border-ink px-2.5 py-1 font-mono text-xs font-bold uppercase transition hover:bg-ink hover:text-white"
          >
            Tutup [ESC] ✕
          </button>
        </div>

        <div className="aspect-video w-full bg-black">
          <iframe
            key={state.id}
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${state.id}?autoplay=1`}
            title={state.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div className="flex items-center justify-between border-t border-ink bg-white px-4 py-3 text-xs">
          <span className="font-serif italic text-neutral-600">
            Tayang di kanal resmi YouTube @melodialam
          </span>
          <a
            href={`https://www.youtube.com/watch?v=${state.id}`}
            target="_blank"
            rel="noreferrer"
            className="font-bold uppercase hover:underline"
          >
            Buka Langsung di YouTube ↗
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Convenience wrapper for the many places that trigger the modal on click.
 *
 * Always `relative`: callers pass a thumbnail container (a size, `overflow-hidden`,
 * a border) and drop a `next/image fill` inside it, and `fill` needs a positioned
 * ancestor. Without it the image's `absolute inset-0` resolves against a distant
 * positioned ancestor, so the photo stretches to that width while `sizes` still
 * asks for thumbnail-sized pixels — an upscale of several times, which reads as a
 * blurry image.
 */
export function WatchButton({
  id,
  title,
  className = "",
  children,
}: {
  id: string;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("melodi:watch", { detail: { id, title } }));
      }}
      className={`relative ${className}`.trim()}
      aria-label={`Putar ${title}`}
    >
      {children}
    </button>
  );
}