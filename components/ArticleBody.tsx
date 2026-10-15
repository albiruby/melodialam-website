import { RichText } from "@payloadcms/richtext-lexical/react";

/**
 * Renders an article body.
 *
 * Two shapes reach this component:
 *
 * - CMS articles carry Lexical editor state, which goes through Payload's own
 *   `<RichText>` so headings, lists, quotes, links and inline uploads survive.
 * - Static articles (the twelve in `lib/content.ts`) carry plain paragraphs.
 *
 * Both land in the same column width and type scale so the two sources are
 * visually indistinguishable, which is what lets the migration be gradual.
 */
export function ArticleBody({
  rich,
  paragraphs,
}: {
  rich?: unknown;
  paragraphs: string[];
}) {
  if (rich) {
    return (
      <div className="article-prose mx-auto max-w-2xl">
        <RichText data={rich as never} />
      </div>
    );
  }

  return (
    <div className="article-prose mx-auto max-w-2xl space-y-5">
      {paragraphs.map((paragraph, i) => (
        <p
          key={i}
          className={`text-base leading-relaxed text-neutral-800 ${
            i === 0
              ? "first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-6xl first-letter:leading-[0.85] first-letter:text-forest"
              : ""
          }`}
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}
