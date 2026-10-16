/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS on purpose:
   a one-off script that runs outside the TS build, like scripts/seed-sanity.js. */
/**
 * One-off: seed the curated Melodi Samsara preview as `video` documents.
 *
 * `lib/catalogue.json` stays the back catalogue (`ADR-0004`); this copies the
 * nine live sessions the /videos page currently leads with into the CMS so an
 * editor can take over — promote, re-date or remove them from the Studio.
 * Deterministic `_id`s mean re-running updates rather than duplicates.
 *
 * `publishedAt` is reconstructed from the scrape anchor (`meta.scrapedAt`) and
 * the captured relative offsets ("3d ago"), catalogue order preserved, so the
 * nine render in the same order but with ages the site recomputes at render
 * instead of captured strings that rot.
 *
 * Dry-run by default; `node scripts/seed-videos.js --apply` writes.
 * Token: the same `SANITY_API_READ_TOKEN` (an Editor token) that
 * `seed-sanity.js` uses; dataset `production`, public.
 */
const fs = require("node:fs");
const path = require("node:path");

const APPLY = process.argv.includes("--apply");

const envPath = path.join(__dirname, "..", ".env");
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const PROJECT = "03sgar5q";
const DATASET = "production";
const TOKEN = env.SANITY_API_READ_TOKEN;
if (!TOKEN) {
  console.error("SANITY_API_READ_TOKEN missing from .env");
  process.exit(1);
}

const catalogue = require("../lib/catalogue.json");

const MONTHS = [
  "januari",
  "februari",
  "maret",
  "april",
  "mei",
  "juni",
  "juli",
  "agustus",
  "september",
  "oktober",
  "november",
  "desember",
];

/** "14 Oktober 2026" → Date (UTC midnight), or null. */
function parseIndonesianDate(value) {
  const m = String(value ?? "").trim().match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!m) return null;
  const month = MONTHS.indexOf(m[2].toLowerCase());
  if (month === -1) return null;
  return new Date(Date.UTC(Number(m[3]), month, Number(m[1])));
}

/** "3d ago" / "2w ago" / "2mo ago" / "1y ago" → milliseconds back. */
function parseRelativeAge(value) {
  const m = String(value ?? "").trim().match(/^(\d+)\s*(d|w|mo|y)\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  switch (m[2].toLowerCase()) {
    case "d":
      return n * 86_400_000;
    case "w":
      return n * 7 * 86_400_000;
    case "mo":
      return n * 30 * 86_400_000;
    default:
      return n * 365 * 86_400_000;
  }
}

/** "1.8K" → 1800, matching how the site reads its own views strings. */
function parseViews(value) {
  const m = String(value ?? "").trim().match(/^([\d.]+)\s*([KM])?$/i);
  if (!m) return undefined;
  const base = Number(m[1]);
  if (Number.isNaN(base)) return undefined;
  const suffix = (m[2] ?? "").toUpperCase();
  return suffix === "K" ? base * 1_000 : suffix === "M" ? base * 1_000_000 : base;
}

const ANCHOR = parseIndonesianDate(catalogue.meta.scrapedAt);
if (!ANCHOR) {
  console.error("catalogue meta.scrapedAt tidak terbaca:", catalogue.meta.scrapedAt);
  process.exit(1);
}

const PREVIEW = 9;
const samsara = catalogue.videos
  .filter((v) => v.venue === "Melodi Samsara")
  .slice(0, PREVIEW);

const docs = samsara.map((v, i) => {
  const offset = parseRelativeAge(v.uploaded);
  // One hour per row keeps the catalogue's order strict under `publishedAt desc`
  // without moving any age label (labels are computed in whole days).
  const published =
    offset === null ? new Date(ANCHOR) : new Date(ANCHOR.getTime() - offset - i * 3_600_000);
  return {
    _id: `video-${v.id}`,
    _type: "video",
    youtubeId: v.id,
    title: v.title,
    publishedAt: published.toISOString(),
    durationSeconds: v.seconds || undefined,
    views: parseViews(v.views),
    venue: v.venue,
    featuring: v.featuring.length > 0 ? v.featuring : undefined,
  };
});

async function main() {
  console.log(`  program   : ${docs[0]?.venue ?? "-"} (${docs.length} video)\n`);
  for (const d of docs) {
    console.log(`  ${d.youtubeId}  ${d.publishedAt.slice(0, 10)}  ${d.title.slice(0, 60)}`);
  }
  console.log("");

  if (!APPLY) {
    console.log("(dry run, tidak menulis — tambahkan --apply)");
    return;
  }

  const res = await fetch(`https://${PROJECT}.api.sanity.io/v2026-05-19/data/mutate/${DATASET}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ mutations: docs.map((d) => ({ createOrReplace: d })) }),
  });

  const body = await res.text();
  console.log(`  mutasi -> ${res.status}`);
  if (!res.ok) {
    throw new Error("mutasi gagal: " + body.slice(0, 600));
  }
  const parsed = JSON.parse(body);
  console.log(`  ${parsed.results?.length ?? 0} dokumen ditulis`);
}

main().catch((error) => {
  console.error(error instanceof Error ? `  ${error.message}` : error);
  process.exitCode = 1;
});
