import { latestStories } from "@/lib/articles";
import { SITE } from "@/lib/site";

/**
 * RSS 2.0 for the Stories.
 *
 * Same pool as the page: the eight stories the Stories page lists, in the same
 * order. A reader that subscribes gets what the home page opens with, not the
 * whole drawer.
 */

const FEED_TITLE = `${SITE.name} — ${SITE.tagline}`;

function xml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822(iso: string): string {
  const date = new Date(`${iso}T09:00:00+07:00`);
  return Number.isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString();
}

export async function GET() {
  const articles = await latestStories(8);
  const latest = articles[0]?.dateISO ?? new Date().toISOString().slice(0, 10);

  const items = articles
    .map((article) => {
      const url = `${SITE.url}/journal/${article.slug}`;
      const absoluteImage = article.image.startsWith("http")
        ? article.image
        : `${SITE.url}${article.image}`;

      return [
        "    <item>",
        `      <title>${xml(article.title)}</title>`,
        `      <link>${xml(url)}</link>`,
        `      <guid isPermaLink="true">${xml(url)}</guid>`,
        `      <pubDate>${rfc822(article.dateISO)}</pubDate>`,
        `      <category>${xml(article.category)}</category>`,
        `      <description>${xml(article.excerpt)}</description>`,
        `      <enclosure url="${xml(absoluteImage)}" type="image/jpeg" />`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xml(FEED_TITLE)}</title>
    <link>${SITE.url}</link>
    <description>${xml(SITE.description)}</description>
    <language>id-ID</language>
    <lastBuildDate>${rfc822(latest)}</lastBuildDate>
    <atom:link href="${SITE.url}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=600",
    },
  });
}
