"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PRIMARY_NAV, SUBMIT_NAV } from "@/lib/site";
import { MelodiAlamLockup } from "./MelodiAlamLockup";
import { SubmitLink } from "./Ticker";

/** Brand copy comes from the `siteSettings` singleton, passed down by the layout. */
export function SiteHeader({
  brand,
}: {
  brand: { tagline: string; strapline: string; est: string; owner: string };
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // The drawer closes on tap rather than in an effect, so navigating from
  // inside it never triggers a cascading render.
  const closeDrawer = () => setDrawerOpen(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="mx-auto max-w-[1360px] px-4 pt-6 sm:px-8">
      {/* Masthead row.
          On phones the lockup takes the whole first row and the meta line and
          actions share the second, because the lockup is a fixed-aspect image
          (2021:286) and cannot wrap the way the old text masthead did. From
          `md` the three-column masthead is restored via explicit ordering. */}
      <div className="grid grid-cols-3 items-center gap-x-3 gap-y-4 border-b-2 border-ink pb-4">
        <div className="order-1 col-span-3 text-center md:order-2 md:col-span-1">
          <Link href="/" className="group inline-flex flex-col items-center justify-center gap-1.5">
            <h1 className="leading-none">
              <MelodiAlamLockup
                width={400}
                sizes="(min-width: 768px) 400px, (min-width: 640px) 360px, 300px"
                className="h-auto w-[300px] transition-transform duration-500 group-hover:scale-[1.03] sm:w-[360px] md:w-[400px]"
                eager
              />
            </h1>
            {/* Sits under the wordmark, not under the medallion: the mark and the
                gap take the first 22.5% of the artwork (455 of 2021px). */}
            <span className="block w-full pl-[22.5%] text-left font-serif text-xs italic tracking-normal text-neutral-600 transition-colors group-hover:text-forest sm:text-sm">
              {brand.tagline}
            </span>
          </Link>
        </div>

        <div className="order-2 col-span-2 text-[11px] uppercase tracking-wider text-neutral-600 md:order-1 md:col-span-1">
          <span className="hidden md:inline">{brand.strapline}</span>
          <span className="md:hidden">{brand.est}</span>
          <div className="hidden text-[10px] text-neutral-400 sm:block">{brand.owner}</div>
        </div>

        <div className="order-3 col-span-1 flex items-center justify-end gap-3">
          <a
            href="https://www.instagram.com/melodi.alam/?hl=en"
            target="_blank"
            rel="noreferrer"
            className="nav-link-anim hidden text-xs font-bold uppercase tracking-wider transition-colors hover:text-forest sm:block"
          >
            IG ↗
          </a>
          <button
            type="button"
            onClick={() => setDrawerOpen((v) => !v)}
            aria-expanded={drawerOpen}
            aria-controls="mobile-nav"
            className="border border-ink px-2.5 py-1 text-xs font-bold uppercase transition duration-300 hover:bg-ink hover:text-white lg:hidden"
          >
            {drawerOpen ? "Tutup ✕" : "Menu ☰"}
          </button>
        </div>
      </div>

      {/* Desktop nav */}
      <nav className="hidden items-center justify-between border-b border-ink py-3 text-xs font-semibold uppercase tracking-wider lg:flex">
        {PRIMARY_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={`nav-link-anim flex items-center gap-1.5 transition-colors hover:text-forest ${
              isActive(item.href) ? "text-forest" : ""
            }`}
          >
            <span>{item.label}</span>
            {item.badge ? (
              <span className="bg-ink px-1.5 py-0.5 text-[10px] font-mono text-white">
                {item.badge}
              </span>
            ) : null}
          </Link>
        ))}
        <SubmitLink />
      </nav>

      {/* Mobile nav */}
      <div
        id="mobile-nav"
        hidden={!drawerOpen}
        className="space-y-3 border-b border-ink bg-paper px-4 py-4 text-xs font-bold uppercase tracking-wider lg:hidden"
      >
        <div className="grid grid-cols-2 gap-2">
          {PRIMARY_NAV.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeDrawer}
              className={`py-1 transition-transform hover:translate-x-1 ${
                isActive(item.href) ? "text-forest" : ""
              }`}
            >
              {String(i + 1).padStart(2, "0")}. {item.label}
            </Link>
          ))}
        </div>
        <Link
          href={SUBMIT_NAV.href}
          onClick={closeDrawer}
          className="mt-2 block bg-ink py-2.5 text-center text-white transition-colors hover:bg-forest"
        >
          {SUBMIT_NAV.label} ↗
        </Link>
      </div>
    </header>
  );
}