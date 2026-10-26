/**
 * The old address of the Stories page.
 *
 * The page is called Stories, so it lives at /stories now. The old URL keeps
 * working as a permanent redirect: links that were already shared, and search
 * engines that already indexed it, land on the new address instead of a 404.
 *
 * The target is a relative path on purpose. A redirect built from `request.url`
 * takes its origin from the request — and therefore from a host header — while
 * a relative `Location` is resolved by the browser against the address it
 * actually used. No host is trusted, and a local build cannot redirect to a
 * production or internal hostname.
 */
export async function GET() {
  return new Response(null, { status: 308, headers: { Location: "/stories" } });
}
