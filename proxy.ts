import { NextResponse, type NextRequest } from "next/server";
import { previewSecret, secretMatches } from "@/lib/sanity-preview";

/**
 * The draft preview answers 404 before the page renders.
 *
 * Inside the page, `notFound()` runs after the request has already begun
 * streaming, so the reader gets the not-found UI with a 200 status - a soft
 * 404. The secret check belongs before the render, which is what this file is
 * for: a wrong or missing secret never reaches the page at all, and the
 * answer is a real 404.
 *
 * The page keeps its own check as well. Two of them cost nothing, and the
 * page's copy still holds if this file is ever removed.
 */
export function proxy(request: NextRequest) {
  const provided = request.nextUrl.searchParams.get("secret");

  if (!secretMatches(provided, previewSecret())) {
    return new NextResponse("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return NextResponse.next();
}

/** Only the preview route is guarded; everything else skips this file. */
export const config = {
  matcher: "/preview/:path*",
};
