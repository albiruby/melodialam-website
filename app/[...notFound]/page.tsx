import { headers } from "next/headers";
import { notFound } from "next/navigation";

/**
 * Any URL that matches no route lands here and throws the framework 404 at
 * request time, inside the root layout, so the branded not-found page, header
 * and footer render instead of a static error shell. Specific routes
 * (including `/api/*`, `/stories/*` and `/preview/*`) still win over this
 * catch-all.
 */
export default async function CatchAllNotFound(): Promise<never> {
  // Reading a request value keeps this route dynamic; a statically generated
  // catch-all bakes the framework error shell instead of the branded page.
  await headers();
  notFound();
}
