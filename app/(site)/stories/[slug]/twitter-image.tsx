/**
 * The same 1200×630 card for Twitter. Next resolves `twitter:image` from this
 * file convention; without it the layout's generic `/og.png` would win and the
 * article's own headline would never appear on X.
 */
export { alt, size, contentType, default, generateStaticParams } from "./opengraph-image";
