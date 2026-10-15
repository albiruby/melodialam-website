import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Everything is public and indexable, so this exists mainly to point crawlers at
 * the sitemap and to keep them out of the API surface.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
