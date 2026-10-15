/**
 * Covers taken from the Instagram posts that match an article.
 *
 * Why this file exists: the imported articles carry placeholder art —
 * `imagePath` in Sanity points at `public/photos/dsc*.webp` — and the posts that
 * belong with them were only reachable by hand. These four are the visible
 * posts whose subject matches an article; the files are saved under
 * `public/covers/` so the cards show the real artwork without a Studio upload.
 *
 *   slug                                   post
 *   melankolia-di-priok-baladagehel-dongker  instagram.com/p/DeZutb1Em2e/
 *   dua-dekade-endah-n-rhesa                 instagram.com/reel/Debuj6NJNn3/
 *   spill-pilihan-lagu-arctic-monkeys        instagram.com/reel/DecAcOcJR7L/
 *   mesin-waktu-anak-warnet-2000-an          instagram.com/reel/DeUyGVMSUPQ/
 *
 * Precedence in `lib/articles.ts`: an image uploaded in the Studio always wins.
 * This map sits under it and above the imported placeholder path, so replacing
 * any of these for real is an upload — no code change, no edit here.
 *
 * `hero` marks the covers that are big enough for the article's own frame.
 * Instagram serves a reel cover at 360x640 and nothing larger without a login,
 * so those stay card-only: the article hero renders ~1294px wide and a 360px
 * source would be stretched past 3x. The one photo post came back at 1842x2304
 * and is used everywhere. Re-export from the app to promote a reel cover.
 */
interface Cover {
  /** Path under `public/`. */
  src: string;
  /** Big enough for the article page's hero frame, not just a card. */
  hero: boolean;
}

const COVERS: Record<string, Cover> = {
  "melankolia-di-priok-baladagehel-dongker": {
    src: "/covers/melankolia-di-priok-baladagehel-dongker.webp",
    hero: true,
  },
  "dua-dekade-endah-n-rhesa": { src: "/covers/dua-dekade-endah-n-rhesa.webp", hero: false },
  "spill-pilihan-lagu-arctic-monkeys": {
    src: "/covers/spill-pilihan-lagu-arctic-monkeys.webp",
    hero: false,
  },
  "mesin-waktu-anak-warnet-2000-an": {
    src: "/covers/mesin-waktu-anak-warnet-2000-an.webp",
    hero: false,
  },
};

/** Card art for a slug — the Instagram cover where there is one. */
export function cardCoverFor(slug: string, fallback: string): string {
  return COVERS[slug]?.src ?? fallback;
}

/** Hero art for a slug — only covers that hold up at the article frame's size. */
export function heroCoverFor(slug: string, fallback: string): string {
  const cover = COVERS[slug];
  return cover?.hero ? cover.src : fallback;
}
