import Image from "next/image";

interface MelodiAlamLockupProps {
  /**
   * The width you intend to display it at, in px — used for the default `sizes`
   * hint only. Actual sizing comes from `className` (`w-[...]` + `h-auto`). The
   * medallion-to-wordmark gap is part of the artwork — do not rebuild the lockup
   * out of two crops.
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
 * LOGO2/Melodi Alam Text Logo - Black.png, at the supplied spacing.
 *
 * This is the only brand asset the site renders: the masthead and both footer
 * blocks use it. It is reproduced exactly as supplied — no recolouring, no
 * re-spacing. The colour medallion survives only in the app icons, which
 * `npm run brand` still generates from LOGO2/Melodi Alam Logo Only - Color.png.
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
      // Intrinsic dimensions, not display ones: the optimiser rounds the served
      // height, so a derived attribute never matches the rendered box and Next
      // logs a one-sided-resize warning on every page. CSS drives the size.
      width={2021}
      height={286}
      sizes={sizes ?? `${width}px`}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      className={className}
    />
  );
}
