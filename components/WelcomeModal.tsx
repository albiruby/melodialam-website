"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * First-visit welcome card.
 *
 * A native <dialog> gives the focus trap, Escape handling and top-layer
 * stacking without a focus-trap library. It opens once per browser (the key is
 * versioned, so a future campaign can show it again), never on preview or
 * submit pages, and leaves the page behind it scroll-locked while open.
 */

const STORAGE_KEY = "melodi-welcome-2026-10";
const OPEN_DELAY_MS = 1200;

export function WelcomeModal() {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/preview") || pathname.startsWith("/submit")) return;

    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // Storage can be unavailable in private modes; showing once is fine.
    }
    if (dismissed) return;

    const timer = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    }
    if (!open && dialog.open) {
      dialog.close();
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // If storage is blocked, the modal may return on the next page; the
      // close button still works for this visit.
    }
    setOpen(false);
  }, []);

  return (
    <>
      {open ? (
        <div
          aria-hidden="true"
          onClick={close}
          className="fixed inset-0 z-[90] bg-ink/80 backdrop-blur-sm"
        />
      ) : null}
      <dialog
        ref={dialogRef}
        aria-labelledby="welcome-title"
        aria-describedby="welcome-copy"
        className="welcome-dialog m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto border-0 bg-paper p-0 text-ink"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
      >
        {open ? (
          <div className="grid md:grid-cols-2">
            <div className="relative flex flex-col items-center justify-center px-6 pb-10 pt-16 text-center sm:px-10 md:pb-12 md:pt-16">
              <button
                type="button"
                onClick={close}
                aria-label="Tutup"
                className="absolute left-3 top-3 inline-flex h-10 w-10 items-center justify-center text-2xl leading-none text-ink transition-colors hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
              >
                ×
              </button>

              <div className="flex flex-col items-center gap-5 sm:gap-6">
                <Image
                  src="/welcome/melodi-alam.png"
                  alt="Melodi Alam"
                  width={2021}
                  height={285}
                  className="h-9 w-auto sm:h-10"
                />
                <span aria-hidden className="h-px w-10 bg-rule" />
                <Image
                  src="/welcome/samsara.webp"
                  alt="Samsara"
                  width={2954}
                  height={804}
                  className="h-11 w-auto sm:h-12"
                />
              </div>

              <p className="mt-8 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600">
                Selamat datang
              </p>
              <h2
                id="welcome-title"
                className="mt-3 font-display text-3xl font-black uppercase leading-[0.95] tracking-tight lg:text-4xl"
              >
                Musik, cerita, dan panggung.
              </h2>
              <p
                id="welcome-copy"
                className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-600"
              >
                Jelajahi jurnalisme musik, sesi intim Samsara, dan suara baru dari
                Indonesia.
              </p>
              <Link
                href="/discover"
                onClick={close}
                className="mt-6 inline-flex min-h-11 items-center bg-ink px-7 py-2.5 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
              >
                Jelajahi
              </Link>
            </div>

            <div className="relative min-h-[220px] md:min-h-[480px]">
              <Image
                src="/welcome/ambience.webp"
                alt="Ruang dengar Samsara di Bogor"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
