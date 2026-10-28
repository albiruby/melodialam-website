"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PRIMARY_NAV, SUBMIT_NAV } from "@/lib/site";
import { InstagramIcon } from "./BrandIcons";
import { MelodiAlamLockup } from "./MelodiAlamLockup";
import { SubmitLink } from "./SubmitLink";

/**
 * One masthead row: the lockup, the desktop nav, and the mobile menu.
 *
 * The old header stacked a ticker, a centred lockup, a tagline, an owner line
 * and a second nav row. This version keeps the brand mark and the links, and
 * lets the page start sooner. The tagline, owner and Instagram move to the
 * footer/drawer, where they do not compete with the first screen.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // The drawer closes on tap rather than in an effect, so navigating from
  // inside it never triggers a cascading render.
  const closeDrawer = () => setDrawerOpen(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="mx-auto max-w-[1360px] px-4 pt-5 sm:px-8">
      <div className="flex items-center justify-between gap-4 border-b border-rule pb-4">
        <Link href="/" className="group inline-flex items-center">
          <MelodiAlamLockup
            width={300}
            sizes="(min-width: 1024px) 300px, (min-width: 640px) 260px, 220px"
            className="h-auto w-[220px] transition-transform duration-500 group-hover:scale-[1.02] sm:w-[260px] lg:w-[300px]"
            eager
          />
        </Link>

        <nav className="hidden items-center gap-8 text-xs font-semibold uppercase tracking-wider xl:flex">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`nav-link-anim transition-colors hover:text-forest ${
                isActive(item.href) ? "text-forest" : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
          <SubmitLink />
        </nav>

        <button
          type="button"
          onClick={() => setDrawerOpen((v) => !v)}
          aria-expanded={drawerOpen}
          aria-controls="mobile-nav"
          className="min-h-11 border border-ink px-3 py-2 text-sm font-bold uppercase transition-colors duration-300 hover:bg-ink hover:text-white xl:hidden"
        >
          {drawerOpen ? "Tutup ✕" : "Menu ☰"}
        </button>
      </div>

      {/* Mobile nav */}
      <div
        id="mobile-nav"
        hidden={!drawerOpen}
        className="space-y-3 border-b border-rule bg-paper px-4 py-4 text-sm font-bold uppercase tracking-wider xl:hidden"
      >
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {PRIMARY_NAV.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeDrawer}
              className={`flex min-h-11 items-center py-2.5 transition-transform hover:translate-x-1 ${
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
          className="mt-2 block bg-ink py-3 text-center text-white transition-colors hover:bg-forest"
        >
          {SUBMIT_NAV.label}
        </Link>
        <a
          href="https://www.instagram.com/melodi.alam/?hl=en"
          target="_blank"
          rel="noreferrer"
          onClick={closeDrawer}
          className="flex min-h-11 items-center gap-2 border-t border-rule pt-3 text-ink transition-colors hover:text-forest"
        >
          <InstagramIcon className="h-4 w-4" />
          Instagram
        </a>
      </div>
    </header>
  );
}
