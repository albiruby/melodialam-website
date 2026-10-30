import sharp from "sharp";

/**
 * The Discover social card — public/og-discover.png (1200x630).
 *
 * Reuses the site card (ink ground + lockup) and adds the section name in the
 * space below it, so a shared /discover link is recognisable without inventing
 * a second visual system. Run with `node scripts/build-og-discover.mjs`.
 */
const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <text x="600" y="530" font-family="Arial, Helvetica, sans-serif" font-size="86" font-weight="700" letter-spacing="10" fill="#F6F5F2" text-anchor="middle">DISCOVER</text>
</svg>`;

const file = "public/og-discover.png";

await sharp("public/og.png")
  .composite([{ input: Buffer.from(svg) }])
  .png({ compressionLevel: 9 })
  .toFile(file);

console.log(`${file} 1200x630`);
