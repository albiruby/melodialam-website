import type { Metadata } from "next";
import { SITE } from "./site";

/**
 * Metadata for a top-level page.
 *
 * The root layout owns the fallback social card, but Next does not copy a
 * page's `title` and `description` into `openGraph`/`twitter`. Without this
 * helper every page kept the site-wide social title while its `<title>` said
 * something else. One function keeps the tab title, canonical, OG, and Twitter
 * fields from drifting apart.
 */
export function pageMetadata({
  title,
  description,
  path,
  image = "/og.png",
  absolute = false,
}: {
  /** Page label, or the full title when `absolute` is set (the home page). */
  title: string;
  description: string;
  path: string;
  image?: string;
  /** Skip the "— MELODI ALAM" suffix and use `title` as the full title. */
  absolute?: boolean;
}): Metadata {
  const socialTitle = absolute ? title : `${title} — ${SITE.name}`;

  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: SITE.locale,
      siteName: SITE.name,
      url: path,
      title: socialTitle,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: socialTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [image],
    },
  };
}
