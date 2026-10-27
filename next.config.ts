import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy, enforced.
 *
 * What it buys: a page that somehow gets an injected `<img>` or `fetch()` cannot
 * load or talk to a host of the attacker's choosing, and no frame from another
 * origin can be embedded. Escaping stops a script from running; this stops what
 * a script would be able to send.
 *
 * Why `'unsafe-inline'` stays in script-src: Next.js injects an inline bootstrap
 * script, and the only way around it is a per-request nonce. A nonce makes every
 * page dynamic, and this site is almost entirely prerendered — the trade would
 * cost far more than it buys. Hashes would have to be regenerated on every build
 * and break whenever a dependency changes its inline output.
 *
 * Every host below is one the site actually loads from. A new one has to be added
 * here or it will be blocked:
 *  - i.ytimg.com                 video thumbnails (plain <img>, not the optimizer)
 *  - cdn.sanity.io               article and pillar art
 *  - youtube.com / youtube-nocookie.com   the watch modal
 *  - *.blob.vercel-storage.com   the demo audio upload (browser → Blob)
 *  - *.vercel-insights.com       Web Analytics beacons
 *
 * `upgrade-insecure-requests` is deliberately absent: the production build also
 * runs on http://localhost, and upgrading there would break the local site.
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "img-src 'self' data: blob: https://i.ytimg.com https://cdn.sanity.io",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "connect-src 'self' https://*.api.sanity.io https://*.apicdn.sanity.io wss://*.api.sanity.io https://*.public.blob.vercel-storage.com https://*.blob.vercel-storage.com https://*.vercel-insights.com",
  "worker-src 'self' blob:",
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com",
].join("; ");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,

  /**
   * A branded 404 for a URL that matches no route. Without this flag Next
   * serves its bare error shell for unmatched paths; `app/global-not-found.tsx`
   * supplies the site chrome instead.
   */
  experimental: {
    globalNotFound: true,
  },

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
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },

  images: {
    /**
     * Article art can now come from Sanity's CDN; the placeholder set in
     * public/photos is the fallback. YouTube's thumbnail host serves the video
     * rows.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/vi/**",
      },
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
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

export default nextConfig;
