"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

/**
 * Web Analytics with the draft preview excluded.
 *
 * A preview URL can carry a secret (until the proxy swaps it for a cookie) and
 * always shows unpublished work. Neither belongs in a page-view product, so
 * any event whose path starts with `/preview` is dropped before it is sent.
 */
function isPreview(event: BeforeSendEvent): boolean {
  try {
    return new URL(event.url, "https://melodialam.invalid").pathname.startsWith("/preview");
  } catch {
    return true;
  }
}

export function SiteAnalytics() {
  return <Analytics beforeSend={(event) => (isPreview(event) ? null : event)} />;
}
