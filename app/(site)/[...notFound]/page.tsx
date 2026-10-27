import { notFound } from "next/navigation";

/**
 * Any URL that matches no route inside the site group lands here and throws the
 * framework 404. Because this page lives in `(site)`, the branded not-found
 * page, header, footer and ticker render — not Next's bare 404. Specific routes
 * (including `/api/*`, `/stories/*` and `/preview/*`) still win over this
 * catch-all.
 */
export default function CatchAllNotFound(): never {
  notFound();
}
