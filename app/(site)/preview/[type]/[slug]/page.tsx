import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/ArticleBody";
import { CATEGORY_LABELS } from "@/lib/content-fallback";
import { imageUrl } from "@/lib/sanity";
import { draftClient, previewSecret, secretMatches } from "@/lib/sanity-preview";

/**
 * Draft preview.
 *
 * `/preview/<type>/<slug>?secret=…` renders the UNPUBLISHED version of one
 * document, so an editor can read a story in the site's own layout before
 * publishing it. Nothing here is indexable, and without the secret the route
 * is a 404 — the drafts are not public, and the preview must not become a way
 * to read them without one.
 *
 * Types: `journal` (an article draft) and `kurasi` (a curated feed post).
 */
export const metadata: Metadata = {
  title: "Pratinjau draf",
  robots: { index: false, follow: false },
};

/**
 * The page cannot be prerendered: the secret and the document both come from
 * the request (`searchParams`), and a preview is never the same twice.
 * Declaring the route blocking is the honest way to say so — the alternative,
 * a Suspense boundary, would only stream a shell that 404s on a wrong secret.
 */
export const instant = false;

const ARTICLE_QUERY = /* groq */ `*[_type == "article" && slug.current == $slug][0] {
  _id,
  "slug": slug.current,
  title,
  category,
  date,
  excerpt,
  note,
  image,
  imagePath,
  body
}`;

const PILLAR_QUERY = /* groq */ `*[_type == "pillarPost" && (_id == $id || igUrl == $url)][0] {
  _id,
  pillar,
  title,
  mediaType,
  date,
  igUrl,
  image,
  "imageWidth": image.asset->metadata.dimensions.width,
  "imageHeight": image.asset->metadata.dimensions.height
}`;

function portableTextToParagraphs(blocks: unknown): string[] {
  if (!Array.isArray(blocks)) return [];
  const out: string[] = [];
  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    const rec = block as Record<string, unknown>;
    if (rec._type !== "block" || !Array.isArray(rec.children)) continue;
    const text = rec.children
      .map((child) =>
        child && typeof child === "object" && typeof (child as { text?: unknown }).text === "string"
          ? (child as { text: string }).text
          : "",
      )
      .join("")
      .trim();
    if (text) out.push(text);
  }
  return out;
}

function Banner({ kind, id }: { kind: string; id: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-2 border-ink bg-ink px-4 py-3 text-white">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-white/70">
          Pratinjau draf — belum tayang
        </p>
        <p className="text-sm font-bold">
          {kind} • <span className="font-mono text-xs">{id}</span>
        </p>
      </div>
      <a
        href={`https://melodi-alam.sanity.studio/structure/${kind}/${id}`}
        target="_blank"
        rel="noreferrer"
        className="border border-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors hover:bg-white hover:text-ink"
      >
        Buka di Studio
      </a>
    </div>
  );
}

export default async function PreviewPage(props: PageProps<"/preview/[type]/[slug]">) {
  const { type, slug } = await props.params;
  const search = await props.searchParams;
  const provided = typeof search.secret === "string" ? search.secret : null;

  if (!draftClient || !secretMatches(provided, previewSecret())) notFound();

  if (type === "journal") {
    const doc = await draftClient.fetch<Record<string, unknown> | null>(ARTICLE_QUERY, { slug });
    if (!doc) notFound();

    const cover =
      imageUrl(doc.image, { width: 1600 }) ??
      (typeof doc.imagePath === "string" ? doc.imagePath : "/photos/dsc09408.webp");
    const body = doc.body;

    return (
      <article>
        <Banner kind="article" id={String(doc._id ?? slug)} />

        <header className="border-b border-ink pb-6">
          <div className="mt-4 flex items-center gap-3 text-[11px] uppercase tracking-widest text-neutral-500">
            <span className="bg-forest px-2 py-0.5 text-white">
              {CATEGORY_LABELS[(doc.category as never) ?? "Fakta Musik"] ?? "Fakta Musik"}
            </span>
            <time dateTime={String(doc.date ?? "")}>{String(doc.date ?? "")}</time>
          </div>
          <h1 className="mt-4 max-w-5xl text-3xl font-bold leading-[1.1] tracking-tight text-balance sm:text-5xl">
            {String(doc.title ?? "")}
          </h1>
          {doc.excerpt ? (
            <p className="mt-4 max-w-3xl font-serif text-lg italic leading-snug text-neutral-700">
              {String(doc.excerpt)}
            </p>
          ) : null}
        </header>

        <div className="relative my-8 aspect-[16/9] w-full overflow-hidden border border-ink bg-neutral-200">
          <Image src={cover} alt={String(doc.title ?? "")} fill preload sizes="100vw" className="object-cover" />
        </div>

        <ArticleBody
          rich={Array.isArray(body) ? body : undefined}
          paragraphs={portableTextToParagraphs(body)}
        />
      </article>
    );
  }

  if (type === "kurasi") {
    const doc = await draftClient.fetch<Record<string, unknown> | null>(
      PILLAR_QUERY,
      { id: `pillar-${slug}`, url: `https://www.instagram.com/p/${slug}/` },
    );
    if (!doc) notFound();

    const cover = imageUrl(doc.image, { width: 900 });
    const width = typeof doc.imageWidth === "number" ? doc.imageWidth : null;
    const height = typeof doc.imageHeight === "number" ? doc.imageHeight : null;

    return (
      <article>
        <Banner kind="pillarPost" id={String(doc._id ?? slug)} />

        <div className="grid gap-8 md:grid-cols-[minmax(0,320px)_1fr]">
          <div className="border border-ink bg-neutral-200">
            {cover ? (
              <Image
                src={cover}
                alt={String(doc.title ?? "")}
                width={width ?? 900}
                height={height ?? 1125}
                className="h-auto w-full object-cover"
              />
            ) : (
              <p className="p-4 text-xs text-neutral-500">Belum ada gambar.</p>
            )}
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-neutral-500">
              {String(doc.pillar ?? "")} • {String(doc.mediaType ?? "")} • {String(doc.date ?? "")}
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              {String(doc.title ?? "")}
            </h1>
            <a
              href={String(doc.igUrl ?? "")}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block font-mono text-xs uppercase tracking-wider underline hover:text-forest"
            >
              Buka post di Instagram
            </a>
          </div>
        </div>
      </article>
    );
  }

  notFound();
}
