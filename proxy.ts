import { NextResponse, type NextRequest } from "next/server";
import {
  PREVIEW_COOKIE,
  PREVIEW_TTL_SECONDS,
  previewSecret,
  previewToken,
  previewTokenMatches,
  secretMatches,
} from "@/lib/sanity-preview";

/**
 * The draft preview answers 404 before the page renders.
 *
 * Inside the page, `notFound()` runs after the request has already begun
 * streaming, so the reader gets the not-found UI with a 200 status - a soft
 * 404. The secret check belongs before the render, which is what this file is
 * for: a wrong or missing secret never reaches the page at all, and the
 * answer is a real 404.
 *
 * A valid `?secret=` is exchanged for a short-lived HttpOnly cookie and the
 * query parameter is removed with a redirect, so the secret does not linger in
 * the address bar, history, Referer headers, or analytics page views. Later
 * requests in the same session authenticate with the cookie.
 *
 * The page keeps its own check as well. Two of them cost nothing, and the
 * page's copy still holds if this file is ever removed.
 */

const PREVIEW_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "no-referrer",
};

function withPreviewHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(PREVIEW_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export function proxy(request: NextRequest) {
  const secret = previewSecret();
  const provided = request.nextUrl.searchParams.get("secret");
  const cookie = request.cookies.get(PREVIEW_COOKIE)?.value;
  const validQuery = secretMatches(provided, secret);

  if (!validQuery && !previewTokenMatches(cookie, secret)) {
    return new NextResponse("Not found", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        ...PREVIEW_HEADERS,
      },
    });
  }

  if (validQuery && secret) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("secret");

    const response = withPreviewHeaders(NextResponse.redirect(url, 307));
    response.cookies.set({
      name: PREVIEW_COOKIE,
      value: previewToken(secret),
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/preview",
      maxAge: PREVIEW_TTL_SECONDS,
    });
    return response;
  }

  // Mark the request as authenticated for the page. The inbound value is
  // dropped first so a client cannot spoof the header.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-melodi-preview");
  requestHeaders.set("x-melodi-preview", "1");

  return withPreviewHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
}

/** Only the preview route is guarded; everything else skips this file. */
export const config = {
  matcher: "/preview/:path*",
};
