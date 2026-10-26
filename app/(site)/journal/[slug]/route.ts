/**
 * The old address of a single story.
 *
 * Same reason as the section redirect: /journal/<slug> now lives at
 * /stories/<slug>, and the old link should not turn into a 404. The relative
 * Location keeps the origin out of the response; the slug is encoded so it
 * cannot inject a header or a second path segment.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  return new Response(null, {
    status: 308,
    headers: { Location: `/stories/${encodeURIComponent(slug)}` },
  });
}
