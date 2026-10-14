import Image from "next/image";

/**
 * Smallest size at which the medallion still reads.
 *
 * Measured from the source art (logobulet.png, 1544x1559 of actual ink): the
 * radial ornament carries detail down to roughly 4px at native scale. Rendered
 * below ~48px that detail collapses into a speck, so callers must not go under
 * this floor. Verified by rendering the mark at 20/24/32/40/48/64/96px on the
 * paper background.
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
 * The circular batik medallion — Melodi Alam's symbol, from logobulet.png.
 * The source export also carries a detached green rule 122px below the mark;
 * it is cropped out during asset build. See scripts/build-brand.mjs.
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
      src="/brand/medallion-256.png"
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