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
  let minX = width, maxX = -1;

  for (let y = 0; y < height; y++) {
    let rowMin = width, rowMax = -1;
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
    let bMin = width, bMax = -1;
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

/** Swaps the RGB of every pixel for a flat colour, keeping the alpha mask intact. */
function recolor(data, channels, hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += channels) {
    out[i] = r;
    out[i + 1] = g;
    out[i + 2] = b;
  }
  return out;
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
  console.log(`  ${name.padEnd(34)} ${String(info.width).padStart(5)}x${String(info.height).padEnd(5)} ${kb.padStart(8)} KB  ${note}`);
}

// ---------------------------------------------------------------------------
// 1. logobulet.png — the circular batik medallion.
//    The export carries a detached green rule below the mark (a stray 335x22
//    bar, 122px clear of the art). It is not part of the emblem, so it is
//    cropped off along with the surrounding whitespace.
// ---------------------------------------------------------------------------
{
  const abs = path.join(ROOT, "logobulet.png");
  const { bands } = await measure(abs);

  console.log(`\nlogobulet.png — ${bands.length} ink band(s):`);
  for (const b of bands) {
    console.log(
      `   y ${b.top}..${b.bottom}  ${b.width}x${b.height}  x ${b.left}..${b.right}` +
        `  centered=${b.centered}${b.height < 60 ? "  <- stray mark, dropped" : ""}`,
    );
  }

  const art = bands.reduce((a, b) => (b.height > a.height ? b : a));
  const square = Math.max(art.width, art.height);

  // Re-centre inside a square canvas so the radial symmetry is not off-axis.
  const pad = (square - art.width) / 2;
  const padY = (square - art.height) / 2;

  const trimmed = sharp(abs).extract({
    left: art.left,
    top: art.top,
    width: art.width,
    height: art.height,
  });

  const squared = trimmed.extend({
    top: Math.round(padY),
    bottom: Math.round(padY),
    left: Math.round(pad),
    right: Math.round(pad),
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });

  const squaredBuffer = await squared.png().toBuffer();

  await emit("medallion.png", sharp(squaredBuffer).resize(1024, 1024), "primary mark, 1024px");
  await emit("medallion-128.png", sharp(squaredBuffer).resize(128, 128), "header/footer, 128px");
  await emit("medallion-256.png", sharp(squaredBuffer).resize(256, 256), "retina, 256px");

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
  console.log(`  app/favicon.ico         16/32/48         ${(ico.length / 1024).toFixed(1)} KB  (replaces the Next.js default)`);
}

// ---------------------------------------------------------------------------
// 2. logotext.png — the "MELODI SAMSARA" wordmark in gold.
//    Only 23% of the canvas is ink; the rest is padding, so this trims to the
//    true 2212x337 lockup and then offers a darkened variant for legibility on
//    the paper background.
// ---------------------------------------------------------------------------
{
  const abs = path.join(ROOT, "logotext.png");
  const { bands } = await measure(abs);
  const art = bands[0];

  console.log(`\nlogotext.png — ink ${art.width}x${art.height} at y ${art.top}..${art.bottom}`);

  const cropped = sharp(abs).extract({
    left: art.left,
    top: art.top,
    width: art.width,
    height: art.height,
  });

  const full = await cropped.png().toBuffer();
  const meta = await sharp(full).metadata();
  const { data: raw, info } = await sharp(full).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  await emit("samsara-wordmark.png", sharp(full).resize(1600), `gold ${meta.width}x${meta.height} -> 1600px`);

  const ink = recolor(raw, info.channels, "#0d0d0d");
  await emit(
    "samsara-wordmark-ink.png",
    sharp(ink, { raw: { width: info.width, height: info.height, channels: 4 } }).resize(1600),
    "recoloured #0d0d0d",
  );

  const forest = recolor(raw, info.channels, "#1b3b2b");
  await emit(
    "samsara-wordmark-forest.png",
    sharp(forest, { raw: { width: info.width, height: info.height, channels: 4 } }).resize(1600),
    "recoloured #1b3b2b",
  );
}

console.log(`\nwritten to public/brand/`);