/**
 * Public Sanity identifiers for reading content.
 *
 * These are literals, not environment variables, and that is deliberate.
 *
 * The same three values are read by two different builds, in two repos:
 *
 * - This repo's Next build, which inlines `NEXT_PUBLIC_*` into the client bundle
 *   at build time.
 * - The Studio in `melodialam-sanity`, built by Sanity's own Vite, which exposes
 *   only `SANITY_STUDIO_*` and exposes them as `import.meta.env`, not
 *   `process.env`.
 *
 * A shared config that read either form broke the other build: the hosted Studio
 * once shipped with all three values `undefined` and refused to boot. A literal is
 * the one shape both bundlers agree on.
 *
 * None of this is secret. The project id appears in every Studio URL and in every
 * image URL Sanity serves. The things that ARE secret — the read token and the
 * webhook secret — stay in `.env` and are read only by server code.
 *
 * DUPLICATED, ON PURPOSE: `melodialam-sanity/lib/sanity-project.ts` holds the same
 * three values, because the Studio needs them to open the datasets. Change one,
 * change the other.
 */

/** Sanity project. */
export const SANITY_PROJECT_ID = "03sgar5q";

/** Public dataset: articles and their images. */
export const SANITY_DATASET = "production";

/** Private dataset: the demo queue and the manager contacts behind it. */
export const SANITY_SUBMISSIONS_DATASET = "submissions";
