import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = path.resolve(import.meta.dirname, "..", "..", "FOTO PLACEHOLDER MELODI ALAM");
const OUT = path.resolve(import.meta.dirname, "..", "public", "photos");

if (!fs.existsSync(SRC)) {
  console.error(`Source photo folder not found:\n  ${SRC}`);
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });

const files = fs
  .readdirSync(SRC)
  .filter((f) => /\.(webp|jpe?g|png)$/i.test(f))
  .sort();

let copied = 0;
let skipped = 0;
let bytes = 0;

for (const file of files) {
  // Lower-case the name so the public URL never depends on Windows casing.
  const target = path.join(OUT, file.toLowerCase());
  const from = path.join(SRC, file);
  const fromStat = fs.statSync(from);

  // Re-copy only when the source is newer or the target is missing, so repeated
  // runs stay cheap. The files are copied verbatim rather than re-encoded:
  // these are already-lossy exports and next/image handles delivery sizing.
  if (fs.existsSync(target) && fs.statSync(target).mtimeMs >= fromStat.mtimeMs) {
    skipped++;
    bytes += fromStat.size;
    continue;
  }

  const meta = await sharp(from).metadata();
  fs.copyFileSync(from, target);
  copied++;
  bytes += fromStat.size;
  console.log(`  ${file}  ${meta.width}x${meta.height}  ${(fromStat.size / 1024).toFixed(0)} KB`);
}

console.log(`\nsource : ${SRC}`);
console.log(`target : ${OUT}`);
console.log(`copied : ${copied}  skipped (up to date): ${skipped}  total: ${files.length}`);
console.log(`size   : ${(bytes / 1024 / 1024).toFixed(1)} MB`);
