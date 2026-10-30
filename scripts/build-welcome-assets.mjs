import fs from "node:fs/promises";
import sharp from "sharp";

/**
 * Welcome modal assets.
 *
 * The two wordmarks arrive with transparent padding and at very different
 * aspect ratios; trim them so the optical size is consistent when stacked.
 * The ambience photo is landscape, so crop it to the 4:5 frame the modal uses.
 * Run with `node scripts/build-welcome-assets.mjs`.
 */
const OUT = "public/welcome";

const MELODI =
  "D:/Project Website Melodi Alam/LOGO2/Melodi Alam Text Logo - Black.png";
const SAMSARA =
  "D:/Project Website Samsara Group/source-assets/logosamsara/Black Logo/blackfullsamping.webp";
const AMBIENCE =
  "D:/Project Website Samsara Group/source-assets/samsara/DSC08220.webp";

await fs.mkdir(OUT, { recursive: true });

await sharp(MELODI).trim().png({ compressionLevel: 9 }).toFile(`${OUT}/melodi-alam.png`);
await sharp(SAMSARA).trim().webp({ quality: 90 }).toFile(`${OUT}/samsara.webp`);
await sharp(AMBIENCE)
  .resize(1200, 1500, { fit: "cover", position: "centre" })
  .webp({ quality: 82 })
  .toFile(`${OUT}/ambience.webp`);

for (const file of ["melodi-alam.png", "samsara.webp", "ambience.webp"]) {
  const meta = await sharp(`${OUT}/${file}`).metadata();
  console.log(`${file} ${meta.width}x${meta.height} ${meta.format}`);
}
