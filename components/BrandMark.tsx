import Image from "next/image";

/**
 * Smallest size at which the medallion still reads.
 *
 * Measured from the source art (the medallion in
 * LOGO2/Melodi Alam Text Logo - Black.png, 280x286 of actual ink): the radial
 * ornament carries detail down to roughly 4px at native scale. Rendered below
 * ~48px that detail collapses into a speck, so callers must not go under this
 * floor. Verified by rendering the mark at 20/24/32/40/48/64/96px on the paper
 * background.
 */
export const BRAND_MARK_MIN_SIZE = 48;

interface BrandMarkProps {
  /** Intrinsic render size in px. Must be >= BRAND_MARK_MIN_SIZE. */
  size?: number;
  /**
   * Responsive srcset hint. Pass this whenever `className` changes the display
   * size across breakpoints, so the browser does not fetch the large variant.
   */
  sizes?: string;
  className?: string;
  /**
   * Empty by default: the mark is decorative and the adjacent wordmark already
   * names the site. Set it only when the mark is the sole label of a link.
   */
  alt?: string;
  /** Set for the above-the-fold instance; Next 16 deprecated `priority`. */
  eager?: boolean;
}

/**
 * The circular batik medallion — Melodi Alam's symbol, from
 * LOGO2/Melodi Alam Text Logo - Black.png. The mark is reproduced as supplied:
 * black, squared onto a transparent canvas by scripts/build-brand.mjs.
 *
 * No caller uses it right now — the masthead and the footer both render the
 * whole MelodiAlamLockup — but the crop stays built for any place that wants
 * the mark on its own.
 */
export function BrandMark({
  size = 64,
  sizes,
  className = "",
  alt = "",
  eager = false,
}: BrandMarkProps) {
  return (
    <Image
      src="/brand/medallion-black-256.png"
      alt={alt}
      width={size}
      height={size}
      sizes={sizes ?? `${size}px`}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      className={className}
    />
  );
}

interface SamsaraWordmarkProps {
  /**
   * Intrinsic render width in px. The artwork's own aspect is 2212:337, so the
   * height is derived from this. Let `className` drive the actual display size
   * when it changes across breakpoints, and pass `sizes` to match.
   */
  width?: number;
  /**
   * `gold` is the supplied artwork (#c2ac7a). `forest` and `ink` are
   * PROPOSALS, not the supplied colour — the gold is too low-contrast on the
   * paper background to read comfortably. Confirm before relying on them.
   */
  tone?: "gold" | "forest" | "ink";
  /**
   * Responsive srcset hint. Pass this whenever `className` changes the display
   * width across breakpoints, so the browser does not fetch the large variant.
   */
  sizes?: string;
  className?: string;
  /** Empty when adjacent copy already names the sub-brand. */
  alt?: string;
  /** Set for the above-the-fold instance, which is the header lockup. */
  eager?: boolean;
}

const WORDMARK_SRC = {
  gold: "/brand/samsara-wordmark.png",
  forest: "/brand/samsara-wordmark-forest.png",
  ink: "/brand/samsara-wordmark-ink.png",
} as const;

/**
 * The Melodi Samsara wordmark from logotext.png — a sub-brand of Melodi Alam
 * (the live-session series and the Samsara Bogor listening space), not the
 * parent site name. Use it only where Samsara is the actual subject.
 *
 * No caller uses it right now — the masthead and the footer both carry the
 * Melodi Alam wordmark instead — but the artwork stays built for the venue
 * sections that may want it back.
 */
export function SamsaraWordmark({
  width = 220,
  tone = "forest",
  sizes,
  className = "",
  alt = "Melodi Samsara",
  eager = false,
}: SamsaraWordmarkProps) {
  return (
    <Image
      src={WORDMARK_SRC[tone]}
      alt={alt}
      width={width}
      height={Math.round((width * 337) / 2212)}
      sizes={sizes ?? `${width}px`}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      className={className}
    />
  );
}

interface MelodiAlamWordmarkProps {
  /**
   * The width you intend to display it at, in px — used for the default `sizes`
   * hint only. Actual sizing comes from `className` (`w-[...]` + `h-auto`).
   */
  width?: number;
  /** Responsive srcset hint, whenever `className` changes the display width. */
  sizes?: string;
  className?: string;
  /** Empty when adjacent copy already names the site. */
  alt?: string;
  /** Set for the above-the-fold instance, which is the masthead lockup. */
  eager?: boolean;
}

/**
 * The MELODI ALAM wordmark alone, from LOGO2/Melodi Alam Text Logo - Black.png,
 * reproduced as supplied — no recolouring.
 *
 * No caller uses it right now: the masthead and both footer blocks carry the
 * full MelodiAlamLockup. It stays available for a surface that wants the name
 * without the mark.
 */
export function MelodiAlamWordmark({
  width = 360,
  sizes,
  className = "",
  alt = "Melodi Alam",
  eager = false,
}: MelodiAlamWordmarkProps) {
  return (
    <Image
      src="/brand/melodi-alam-wordmark-black.png"
      alt={alt}
      // The artwork's own pixel size, not the display size. Callers size it with
      // CSS (`w-[...]` + `h-auto`); passing the intrinsic dimensions keeps the
      // attributes honest and avoids a one-sided-resize warning, since the
      // optimiser rounds the served height and the rendered box never matches a
      // derived attribute exactly.
      width={1566}
      height={126}
      sizes={sizes ?? `${width}px`}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      className={className}
    />
  );
}

interface MelodiAlamLockupProps {
  /**
   * The width you intend to display it at, in px — used for the default `sizes`
   * hint only. Actual sizing comes from `className` (`w-[...]` + `h-auto`). The
   * medallion-to-wordmark gap is part of the artwork — do not rebuild the lockup
   * out of the two crops.
   */
  width?: number;
  /** Responsive srcset hint, whenever `className` changes the display width. */
  sizes?: string;
  className?: string;
  /** Empty when adjacent copy already names the site. */
  alt?: string;
  /** Set for the above-the-fold instance, which is the masthead lockup. */
  eager?: boolean;
}

/**
 * The complete MELODI ALAM lockup — [medallion][wordmark] — from
 * LOGO2/Melodi Alam Text Logo - Black.png, at the supplied spacing. The
 * masthead uses this; anywhere the two parts are wanted separately, use
 * BrandMark and MelodiAlamWordmark, which are cut from the same file.
 */
export function MelodiAlamLockup({
  width = 420,
  sizes,
  className = "",
  alt = "Melodi Alam",
  eager = false,
}: MelodiAlamLockupProps) {
  return (
    <Image
      src="/brand/melodi-alam-lockup-black.png"
      alt={alt}
      // Intrinsic dimensions, not display ones — same reason as the wordmark.
      width={2021}
      height={286}
      sizes={sizes ?? `${width}px`}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      className={className}
    />
  );
}