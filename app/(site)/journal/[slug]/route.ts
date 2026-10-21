/**
 * The old address of a single story.
 *
 * Same reason as the section redirect: /journal/<slug> now lives at
 * /stories/<slug>, and the old link should not turn into a 404.
 */
export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  return Response.redirect(new URL(`/stories/${slug}`, request.url), 308);
}
