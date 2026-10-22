import { ImageResponse } from "next/og";
import { articleBySlug } from "@/lib/articles";
import { CATEGORY_LABELS } from "@/lib/content-fallback";
import { SITE } from "@/lib/site";

/**
 * The social card for an article.
 *
 * The article's own cover is an Instagram card in 4:5, and every social
 * platform crops that to a wide rectangle — the caption baked into the card is
 * what gets cut. So the card is drawn here instead: 1200×630, ink ground, the
 * headline set large enough to read in a timeline.
 */
export const alt = "Melodi Alam";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function trimTitle(title: string, max = 150): string {
  return title.length > max ? `${title.slice(0, max - 1).trimEnd()}…` : title;
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await articleBySlug(slug);

  const category = article ? CATEGORY_LABELS[article.category] : "Stories";
  const title = trimTitle(article?.title ?? "Melodi Alam");
  const date = article?.date ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0d0d0d",
          color: "#f6f5f2",
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, letterSpacing: 10, fontWeight: 700 }}>MELODI ALAM</div>
            <div style={{ fontSize: 18, letterSpacing: 6, color: "#f6f5f2aa", marginTop: 6 }}>
              STORIES &amp; WATCH
            </div>
          </div>
          <div
            style={{
              display: "flex",
              border: "1px solid #f6f5f2",
              padding: "8px 14px",
              fontSize: 18,
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            {category}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: title.length > 90 ? 50 : 62,
            lineHeight: 1.1,
            fontWeight: 700,
            letterSpacing: -1,
          }}
        >
          {title}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 10 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ width: 44, height: 4, background: i === 0 ? "#1b3b2b" : "#f6f5f2" }} />
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 18, letterSpacing: 3, color: "#f6f5f2aa" }}>
            {date} · {SITE.url.replace(/^https?:\/\//, "")}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
