import type { Metadata } from "next";

/**
 * Root layout for the embedded Studio.
 *
 * It has to be its own root layout because the site's lives in the `(site)`
 * route group — a route group is not a layout provider for routes outside it,
 * and Next.js refuses to render a page with no root layout above it.
 *
 * Kept deliberately bare: the Studio ships its own styling, and wrapping it in
 * the site's chrome would fight that.
 */

export const metadata: Metadata = {
  title: "Melodi Alam — Studio",
  // The Studio is an editing tool; there is nothing here for a crawler.
  robots: { index: false, follow: false },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
