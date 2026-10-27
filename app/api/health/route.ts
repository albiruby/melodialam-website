import { NextResponse } from "next/server";
import { contentClient } from "@/lib/sanity";

/**
 * A health check with one job: say whether the site can still reach its content.
 *
 * A page that renders from cache looks healthy long after the CMS stopped
 * answering, so this asks the CMS a question that costs nothing — the project
 * id — and reports what came back. Point an uptime monitor at this URL.
 *
 * The success response is cached at the edge for 30 seconds, so a public
 * monitor cannot turn this into an uncached Sanity query per request. Failures
 * are not cached: recovery has to be visible on the next check.
 *
 * Deliberately says nothing about versions, environment, latency or
 * configuration: the response is public.
 */
export async function GET() {
  try {
    await contentClient.fetch("count(*[_type == 'siteSettings'])", {}, { cache: "no-store" });
    return NextResponse.json(
      { ok: true, sanity: "reachable" },
      { headers: { "cache-control": "public, s-maxage=30" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, sanity: "unreachable" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
