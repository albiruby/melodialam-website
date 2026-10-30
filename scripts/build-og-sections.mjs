import sharp from "sharp";

/**
 * Section social cards — public/og-<section>.png (1200x630).
 *
 * Reuses the site card (ink ground + lockup) and adds the section name in the
 * space below it, so a shared section link is recognisable without inventing a
 * second visual system. Run with `node scripts/build-og-sections.mjs`.
 */
const SECTIONS = [
  { file: "og-discover.png", label: "DISCOVER", size: 86, spacing: 10 },
  { file: "og-stories.png", label: "STORIES", size: 96, spacing: 12 },
  { file: "og-bicara.png", label: "BICARA MELODI", size: 64, spacing: 6 },
  { file: "og-videos.png", label: "MELODI SAMSARA", size: 60, spacing: 6 },
  { file: "og-tentang.png", label: "TENTANG", size: 96, spacing: 12 },
  { file: "og-submit.png", label: "SUBMIT KARYA", size: 68, spacing: 6 },
];

for (const section of SECTIONS) {
  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <text x="600" y="530" font-family="Arial, Helvetica, sans-serif" font-size="${section.size}" font-weight="700" letter-spacing="${section.spacing}" fill="#F6F5F2" text-anchor="middle">${section.label}</text>
</svg>`;

  await sharp("public/og.png")
    .composite([{ input: Buffer.from(svg) }])
    .png({ compressionLevel: 9 })
    .toFile(`public/${section.file}`);

  console.log(`public/${section.file} 1200x630`);
}
