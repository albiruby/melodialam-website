import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { imageUrl } from "@/lib/sanity";

/**
 * Renders an article body.
 *
 * Two shapes reach this component:
 *
 * - CMS articles carry Portable Text, which goes through `<PortableText>` so
 *   headings, lists, quotes, links and inline images survive.
 * - Static articles (the twelve in `lib/content-fallback.ts`) carry plain paragraphs.
 *
 * Both land in the same column width and type scale, so the two sources are
 * visually indistinguishable — which is what lets the migration be gradual.
 *
 * A server component: it renders text and builds image URLs, and nothing here
 * needs the browser.
 */

const components: PortableTextComponents = {
  types: {
    image: ({ value }) => {
      const src = imageUrl(value, { width: 1600 });
      if (!src) return null;

      const alt =
        value && typeof value === "object" && typeof (value as { alt?: unknown }).alt === "string"
          ? (value as { alt: string }).alt
          : "";

      return (
        <figure className="my-8">
          {/*
            A plain <img>, not next/image: Sanity's CDN already resizes and
            converts this URL (`auto=format` in lib/sanity.ts), and the inline
            block carries no stored dimensions for next/image to lay out against.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="w-full border border-ink" loading="lazy" />
        </figure>
      );
    },
  },
};

export function ArticleBody({
  rich,
  paragraphs,
}: {
  rich?: unknown[];
  paragraphs: string[];
}) {
  if (rich && rich.length > 0) {
    return (
      <div className="article-prose mx-auto max-w-2xl">
        <PortableText value={rich as never} components={components} />
      </div>
    );
  }

  return (
    <div className="article-prose mx-auto max-w-2xl space-y-5">
      {/*
        No per-paragraph classes: the opening drop cap is applied in
        app/globals.css to `.article-prose > p:first-of-type`, so the static and
        CMS paths get identical typography from one place.
      */}
      {paragraphs.map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </div>
  );
}
