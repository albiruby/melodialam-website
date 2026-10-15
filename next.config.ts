import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const isDev = process.env.NODE_ENV === "development";

/**
 * The directives that cannot break a working page, so they are enforced now:
 * nothing here restricts anything the site actually loads.
 */
const SAFE_CSP = ["base-uri 'self'", "object-src 'none'", "frame-ancestors 'self'", "form-action 'self'"].join(
  "; ",
);

/**
 * The full policy, still report-only.
 *
 * It is shipped unenforced because a CSP that is wrong takes the site down
 * silently, and this one has not been exercised across every route yet. Roll it
 * out by reading the console violations on a few real page loads, then moving
 * this value up into the enforcing header above.
 *
 * Two concessions are deliberate:
 *  - `'unsafe-inline'` for scripts: Next injects an inline bootstrap. Removing it
 *    needs nonces, which needs middleware, which this project does not have yet.
 *  - `'unsafe-eval'` in development only, for Turbopack's HMR runtime.
 *
 * `media-src` must allow `blob:` because the demo form previews a picked file
 * from an object URL, and `frame-src` must allow YouTube for the watch modal.
 */
const REPORT_ONLY_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "img-src 'self' data: blob: https://i.ytimg.com",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com",
].join("; ");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,

  /** The framework version is not useful to attackers and is free to omit. */
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // Vercel terminates TLS, so this is safe to send unconditionally.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Content-Security-Policy", value: SAFE_CSP },
          { key: "Content-Security-Policy-Report-Only", value: REPORT_ONLY_CSP },
        ],
      },
    ];
  },

  images: {
    /**
     * Everything local is served from public/. The only remote host left is
     * YouTube's thumbnail CDN, for the video rows; article art now comes from
     * the placeholder set in public/photos.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/vi/**",
      },
    ],
  },

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

/**
 * Payload's Next.js plugin (bundler compatibility for its dependencies).
 * Everything else in this file is ours; the wrapper only adds to it.
 */
export default withPayload(nextConfig);
