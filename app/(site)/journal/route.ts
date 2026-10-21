/**
 * The old address of the Stories page.
 *
 * The page is called Stories, so it lives at /stories now. The old URL keeps
 * working as a permanent redirect: links that were already shared, and search
 * engines that already indexed it, land on the new address instead of a 404.
 */
export async function GET(request: Request) {
  return Response.redirect(new URL("/stories", request.url), 308);
}
