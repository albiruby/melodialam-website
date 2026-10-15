"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Stand-in for the original YouTube-iframe overlay. Rendered once and shared
 * by every page that needs a "watch" affordance.
 *
 * Mount it with <VideoModal /> and open it imperatively through
 * window.dispatchEvent(new CustomEvent("melodi:watch", { detail: { id, title } })).
 *
 * Accessibility contract, since this is a dialog: focus moves into the panel on
 * open and returns to whatever opened it on close, Tab cycles inside the panel
 * instead of escaping to the page behind, the page behind cannot scroll, and
 * Escape closes.
 */
export function VideoModal() {
  const [state, setState] = useState<{ id: string; title: string } | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);

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

  /**
   * Remember the opener, lock the page behind, move focus in; undo all three
   * when the dialog goes away. The horizontal padding compensates for the
   * scrollbar that locking removes, so the layout does not jump.
   */
  useEffect(() => {
    if (!state) return;

    opener.current = document.activeElement as HTMLElement | null;
    const { overflow, paddingRight } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    closeButton.current?.focus();

    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      opener.current?.focus?.();
    };
  }, [state]);

  /** Keep Tab inside the panel. */
  const onPanelKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "Tab") return;

    const root = panel.current;
    if (!root) return;

    const focusable = Array.from(
      root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.offsetParent !== null || el.tagName === "IFRAME");

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!state) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
      className="modal-backdrop is-open fixed inset-0 z-50 flex items-center justify-center overscroll-contain bg-black/85 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={panel}
        onKeyDown={onPanelKeyDown}
        className="modal-panel w-full max-w-4xl border-2 border-ink bg-white shadow-[10px_10px_0px_#1B3B2B]"
      >
        <div className="flex items-center justify-between border-b border-ink bg-paper px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span aria-hidden className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
            <h2
              id="video-modal-title"
              className="max-w-md truncate font-mono text-xs font-bold uppercase sm:max-w-xl"
            >
              {state.title}
            </h2>
          </div>
          <button
            ref={closeButton}
            type="button"
            onClick={close}
            className="border border-ink px-2.5 py-1 font-mono text-xs font-bold uppercase transition hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
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

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink bg-white px-4 py-3 text-xs">
          <span className="font-serif italic text-neutral-600">
            Tayang di kanal resmi YouTube @melodialam
          </span>
          <a
            href={`https://www.youtube.com/watch?v=${state.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold uppercase hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
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
