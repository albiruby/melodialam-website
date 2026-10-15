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

/**
 * The flat colour of the last ink band — the kit's own brand colour.
 *
 * Sampled rather than typed in: the green belongs to the supplied artwork, so
 * the build reads it back from the colour source instead of us restating it
 * (and drifting from it) in code.
 */
async function sampleFlatColour(abs) {
  const { data, width, channels, bands } = await measure(abs);
  const band = bands[bands.length - 1];

  const counts = new Map();
  for (let y = band.top; y <= band.bottom; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      if (data[i + 3] < 200) continue;
      const key = `${data[i]},${data[i + 1]},${data[i + 2]}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  const [rgb] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return `#${rgb
    .split(",")
    .map((v) => Number(v).toString(16).padStart(2, "0"))
    .join("")}`;
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
// 1. LOGO2/Melodi Alam Logo Only - Color.png — the circular batik medallion.
//    The export is a stacked lockup: the medallion, then a detached green rule
//    and the wordmark below it. Only the medallion band is the emblem, so the
//    smaller bands below are dropped along with the surrounding whitespace.
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
//    The source left the workspace when the LOGO2 kit replaced it, so this
//    section is skipped when the file is absent and the committed
//    samsara-wordmark assets stay as they are. The site no longer renders this
//    wordmark; the artwork remains for the venue sections that may want it.
// ---------------------------------------------------------------------------
{
  const abs = path.join(ROOT, "logotext.png");
  if (!fs.existsSync(abs)) {
    console.log("\nlogotext.png — source not present, keeping the committed samsara-wordmark assets.");
  } else {
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
}

// ---------------------------------------------------------------------------
// 3. LOGO2/Melodi Alam Text Logo - White.png — the MELODI ALAM wordmark.
//    The lockup is [medallion][wordmark]. The medallion already ships in colour
//    from LOGO2/Melodi Alam Logo Only - Color.png above, so only the wordmark is
//    emitted here — the split is measured from the widest empty column run, not
//    guessed.
//
//    Colour: the wordmark keeps the kit's OWN green, sampled from the colour
//    artwork in LOGO2. It is deliberately not mapped onto the site palette
//    (ink/forest) — the logo is the client's mark and is reproduced as supplied.
//    The white variant is the supplied artwork, kept for dark surfaces.
// ---------------------------------------------------------------------------
{
  const abs = path.join(ROOT, "LOGO2", "Melodi Alam Text Logo - White.png");
  const { width, height, data, channels } = await measure(abs);

  const colInk = new Array(width).fill(false);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * channels + 3] > ALPHA_MIN) colInk[x] = true;
    }
  }

  let split = -1;
  let best = 0;
  let runStart = null;
  for (let x = 0; x <= width; x++) {
    const empty = x === width || !colInk[x];
    if (empty) {
      if (runStart === null) runStart = x;
    } else {
      if (runStart !== null) {
        const len = x - runStart;
        if (runStart > 0 && len > best) {
          best = len;
          split = x;
        }
        runStart = null;
      }
    }
  }

  let minX = width, maxX = -1, minY = height, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = split; x < width; x++) {
      if (data[(y * width + x) * channels + 3] > ALPHA_MIN) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const cropped = sharp(abs).extract({
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  });

  const full = await cropped.png().toBuffer();
  const meta = await sharp(full).metadata();
  const { data: raw, info } = await sharp(full).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const brandGreen = await sampleFlatColour(
    path.join(ROOT, "LOGO2", "Melodi Alam Logo Only - Color.png"),
  );

  console.log(
    `\nMelodi Alam Text Logo — wordmark ${meta.width}x${meta.height} (medallion split at x=${split})`,
  );
  console.log(`   kit colour sampled from the colour artwork: ${brandGreen}`);

  const green = recolor(raw, info.channels, brandGreen);
  await emit(
    "melodi-alam-wordmark-green.png",
    sharp(green, { raw: { width: info.width, height: info.height, channels: 4 } }),
    `kit green ${brandGreen} ${meta.width}x${meta.height}`,
  );

  await emit("melodi-alam-wordmark-white.png", sharp(full), `white ${meta.width}x${meta.height}`);
}

console.log(`\nwritten to public/brand/`);