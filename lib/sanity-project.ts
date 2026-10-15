/**
 * Public Sanity identifiers.
 *
 * These are literals, not environment variables, and that is deliberate.
 *
 * `sanity.config.ts` is read by TWO different bundlers:
 *
 * - Next, for the embedded Studio at /studio. Next inlines `NEXT_PUBLIC_*` into
 *   the client bundle at build time.
 * - Sanity's own Vite build, for the hosted Studio at melodi-alam.sanity.studio.
 *   Vite's `envPrefix` only exposes `SANITY_STUDIO_*`, and it exposes them as
 *   `import.meta.env`, not `process.env`.
 *
 * A config file that reads either form breaks the other build: the hosted Studio
 * shipped with all three values `undefined` and refused to boot. A literal is the
 * one shape both bundlers agree on.
 *
 * None of this is secret. The project id appears in every Studio URL and in every
 * image URL Sanity serves. The things that ARE secret — the read token and the
 * webhook secret — stay in `.env` and are read only by server code.
 *
 * Keep this module dependency-free: it is pulled into the Studio bundle.
 */

/** Sanity project. */
export const SANITY_PROJECT_ID = "03sgar5q";

/** Public dataset: articles and their images. */
export const SANITY_DATASET = "production";

/** Private dataset: the demo queue and the manager contacts behind it. */
export const SANITY_SUBMISSIONS_DATASET = "submissions";
