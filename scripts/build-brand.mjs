import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

// scripts/ -> melodi-alam/ -> workspace root, where the source PNGs live.
const ROOT = path.resolve(import.meta.dirname, "..", "..");
const OUT = path.join(import.meta.dirname, "..", "public", "brand");

fs.mkdirSync(OUT, { recursive: true });

/** Nothing below this alpha counts as ink — keeps antialiasing fuzz out of the bbox. */
const ALPHA_MIN = 8;

/** Measures the ink bounding box, and the horizontal runs of ink, from alpha. */
async function measure(abs) {
  const { data, info } = await sharp(abs).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const bands = [];
  let start = null;
  let minX = width,
    maxX = -1;

  for (let y = 0; y < height; y++) {
    let rowMin = width,
      rowMax = -1;
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * channels + 3] > ALPHA_MIN) {
        if (x < rowMin) rowMin = x;
        if (x > rowMax) rowMax = x;
      }
    }
    if (rowMax >= 0) {
      if (rowMin < minX) minX = rowMin;
      if (rowMax > maxX) maxX = rowMax;
      if (start === null) start = y;
    } else if (start !== null) {
      bands.push({ top: start, bottom: y - 1 });
      start = null;
    }
  }
  if (start !== null) bands.push({ top: start, bottom: height - 1 });

  // Wider than the topmost band? Then it is a detached mark, not part of the art.
  for (const b of bands) {
    let bMin = width,
      bMax = -1;
    for (let y = b.top; y <= b.bottom; y++) {
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * channels + 3] > ALPHA_MIN) {
          if (x < bMin) bMin = x;
          if (x > bMax) bMax = x;
        }
      }
    }
    b.left = bMin;
    b.right = bMax;
    b.width = bMax - bMin + 1;
    b.height = b.bottom - b.top + 1;
    const cx = (bMin + bMax) / 2;
    b.centered = Math.abs(cx - width / 2) < 2;
  }

  return { width, height, data, channels, bands, minX, maxX };
}

/**
 * Writes a multi-size .ico. The ICO container may embed PNG payloads directly
 * (Vista and later, supported by every current browser), which avoids needing a
 * library that can emit BMP-format icons — sharp cannot write .ico at all.
 */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + dir.length;

  entries.forEach((entry, i) => {
    const at = i * 16;
    // A stored value of 0 means 256px.
    dir.writeUInt8(entry.size >= 256 ? 0 : entry.size, at + 0); // width
    dir.writeUInt8(entry.size >= 256 ? 0 : entry.size, at + 1); // height
    dir.writeUInt8(0, at + 2); // palette colour count
    dir.writeUInt8(0, at + 3); // reserved
    dir.writeUInt16LE(1, at + 4); // colour planes
    dir.writeUInt16LE(32, at + 6); // bits per pixel
    dir.writeUInt32LE(entry.png.length, at + 8);
    dir.writeUInt32LE(offset, at + 12);
    offset += entry.png.length;
  });

  return Buffer.concat([header, dir, ...entries.map((entry) => entry.png)]);
}

async function emit(name, pipeline, note) {
  const file = path.join(OUT, name);
  const info = await pipeline.png({ compressionLevel: 9, palette: false }).toFile(file);
  const kb = (fs.statSync(file).size / 1024).toFixed(1);
  console.log(
    `  ${name.padEnd(34)} ${String(info.width).padStart(5)}x${String(info.height).padEnd(5)} ${kb.padStart(8)} KB  ${note}`,
  );
}

// ---------------------------------------------------------------------------
// 1. LOGO2/Melodi Alam Logo Only - Color.png — the app icons.
//    The export is a stacked lockup: the medallion, then a detached green rule
//    and the wordmark below it. Only the medallion band is the emblem, so the
//    smaller bands below are dropped along with the surrounding whitespace.
//
//    The colour medallion lives on only here. The site itself renders the black
//    lockup from section 2; there is no colour medallion on any page.
// ---------------------------------------------------------------------------
{
  const abs = path.join(ROOT, "LOGO2", "Melodi Alam Logo Only - Color.png");
  const { bands } = await measure(abs);

  console.log(`\nMelodi Alam Logo Only - Color.png — ${bands.length} ink band(s):`);
  for (const b of bands) {
    console.log(
      `   y ${b.top}..${b.bottom}  ${b.width}x${b.height}  x ${b.left}..${b.right}` +
        `  centered=${b.centered}${b.height < 60 ? "  <- stray mark, dropped" : ""}`,
    );
  }

  const art = bands.reduce((a, b) => (b.height > a.height ? b : a));

  // Re-centre inside a square canvas so the radial symmetry is not off-axis.
  const square = Math.max(art.width, art.height);
  const pad = (square - art.width) / 2;
  const padY = (square - art.height) / 2;

  const squaredBuffer = await sharp(abs)
    .extract({ left: art.left, top: art.top, width: art.width, height: art.height })
    .extend({
      top: Math.round(padY),
      bottom: Math.round(padY),
      left: Math.round(pad),
      right: Math.round(pad),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // App Router picks these up by filename: app/icon.png becomes the favicon and
  // app/apple-icon.png the touch icon. No metadata wiring needed.
  const appDir = path.join(import.meta.dirname, "..", "app");
  await sharp(squaredBuffer).resize(512, 512).png().toFile(path.join(appDir, "icon.png"));
  await sharp(squaredBuffer).resize(180, 180).png().toFile(path.join(appDir, "apple-icon.png"));

  // The scaffold ships a Next.js favicon.ico carrying 48/32/16 entries, which
  // outranks icon.png in the tab because its sizes are closer to the slot.
  // Replacing it is what actually gets the brand mark into the browser tab.
  const icoEntries = [];
  for (const size of [16, 32, 48]) {
    icoEntries.push({ size, png: await sharp(squaredBuffer).resize(size, size).png().toBuffer() });
  }
  const ico = buildIco(icoEntries);
  fs.writeFileSync(path.join(appDir, "favicon.ico"), ico);

  console.log(`  app/icon.png                     512x512    (favicon)`);
  console.log(`  app/apple-icon.png               180x180    (touch icon)`);
  console.log(
    `  app/favicon.ico         16/32/48         ${(ico.length / 1024).toFixed(1)} KB  (replaces the Next.js default)`,
  );
}

// ---------------------------------------------------------------------------
// 2. LOGO2/Melodi Alam Text Logo - Black.png — the lockup the site renders.
//    [medallion][wordmark], supplied in black on transparency, emitted exactly
//    as supplied: no recolouring, no re-spacing, and not split into parts. The
//    masthead and both footer blocks render this one file, so it is the only
//    asset written to public/brand/.
// ---------------------------------------------------------------------------
{
  const abs = path.join(ROOT, "LOGO2", "Melodi Alam Text Logo - Black.png");
  const { width, height, data, channels } = await measure(abs);

  let minX = width,
    maxX = -1,
    minY = height,
    maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * channels + 3] > ALPHA_MIN) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const box = { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };

  console.log(`\nMelodi Alam Text Logo - Black.png — lockup ${box.width}x${box.height}`);

  await emit("melodi-alam-lockup-black.png", sharp(abs).extract(box), "as supplied");
}

console.log(`\nwritten to public/brand/`);

// ---------------------------------------------------------------------------
// 3. The social card — public/og.png (1200x630).
//    A link shared from the site needs a picture, and the pages that have no
//    photo of their own (home, /kurasi, /pahlawan-kota, /videos) had none.
//    Ink ground, paper lockup, the dash strip from DEC-002 — the site's own
//    shapes, not a picture of a concert.
// ---------------------------------------------------------------------------
{
  const abs = path.join(ROOT, "LOGO2", "Melodi Alam Text Logo - White.png");
  const { width, height, data, channels } = await measure(abs);

  let minX = width,
    maxX = -1,
    minY = height,
    maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * channels + 3] > ALPHA_MIN) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const box = { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
  const logoWidth = 860;
  const logoHeight = Math.round((logoWidth * box.height) / box.width);

  // Five dashes, the DEC-002 strip, in paper on ink.
  const dashStrip = Buffer.from(
    `<svg width="${logoWidth}" height="10" xmlns="http://www.w3.org/2000/svg">` +
      Array.from({ length: 5 }, (_, i) => {
        const x = i * 56;
        return `<rect x="${x}" y="0" width="44" height="4" fill="#F6F5F2"/>`;
      }).join("") +
      `</svg>`,
  );

  const canvas = sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 0x0d, g: 0x0d, b: 0x0d, alpha: 1 },
    },
  });

  const logo = await sharp(abs)
    .extract(box)
    .resize({ width: logoWidth, height: logoHeight, fit: "fill" })
    .png()
    .toBuffer();

  const file = path.join(import.meta.dirname, "..", "public", "og.png");
  await canvas
    .composite([
      { input: dashStrip, left: (1200 - logoWidth) / 2, top: 252 },
      { input: logo, left: (1200 - logoWidth) / 2, top: 300 },
    ])
    .png({ compressionLevel: 9, palette: false })
    .toFile(file);

  console.log(
    `\npublic/og.png                                    1200x630  ${(
      fs.statSync(file).size / 1024
    ).toFixed(1)} KB  (social card)`,
  );
}
