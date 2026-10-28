/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS on purpose:
   it loads the tsc-compiled output of lib/*.ts, and Node cannot resolve this
   project's extensionless `./taxonomy` import as ESM. */
/**
 * One-off: seed Sanity from this repo's own content files.
 *
 * The source of truth for the twelve articles, the interview rows, the
 * Pahlawan Kota directory and the ticker is still `lib/content-fallback.ts`; this copies
 * them into the CMS so an editor can take over. Deterministic `_id`s mean
 * re-running updates rather than duplicates.
 *
 * Run with `npm run seed:sanity`, which compiles `lib/*.ts` to CommonJS first —
 * Node cannot resolve this project's extensionless `./taxonomy` import directly.
 */
const fs = require("node:fs");
const path = require("node:path");

const BUILD_DIR = path.resolve(process.argv[2] ?? "");
if (!process.argv[2]) {
  console.error("Usage: node scripts/seed-sanity.cjs <compiled-dir>");
  process.exit(1);
}

const { ARTICLES, INTERVIEW_ROWS } = require(path.join(BUILD_DIR, "content.js"));
const { SITE } = require(path.join(BUILD_DIR, "site.js"));
const catalogue = require("../lib/catalogue.json");

/* --- env ------------------------------------------------------------------ */

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

/* --- builders ------------------------------------------------------------- */

/** `string[]` paragraphs → Portable Text blocks. */
function portableText(paragraphs) {
  return paragraphs.map((text, i) => ({
    _type: "block",
    _key: `b${i}`,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `s${i}`, text, marks: [] }],
  }));
}

/** "10 Oktober 2026" → "2026-10-10". The CMS stores a real date. */
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
function isoDate(label) {
  const m = String(label).trim().match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!m) return null;
  const month = MONTHS.indexOf(m[2].toLowerCase());
  if (month === -1) return null;
  return `${m[3]}-${String(month + 1).padStart(2, "0")}-${String(m[1]).padStart(2, "0")}`;
}

const articleDocs = ARTICLES.map((a) => ({
  _id: `article-${a.slug}`,
  _type: "article",
  title: a.title,
  slug: { _type: "slug", current: a.slug },
  category: a.category,
  date: isoDate(a.date),
  excerpt: a.excerpt,
  imagePath: a.image,
  body: portableText(a.body),
}));

const playlistDocs = catalogue.playlists.map((p, i) => ({
  _id: `playlist-${p.id}`,
  _type: "playlist",
  title: p.title,
  playlistId: p.id,
  count: Number(p.count) || undefined,
  order: i + 1,
}));

const interviewDocs = INTERVIEW_ROWS.map((r, i) => ({
  _id: `interview-${r.slug}`,
  _type: "interview",
  artist: r.artist,
  headline: r.headline,
  youtubeId: r.videoId,
  caption: r.caption,
  order: i + 1,
}));

const settingsDoc = {
  _id: "siteSettings",
  _type: "siteSettings",
  name: SITE.name,
  curationNote: "kurasi redaksi",
  cardCurtain: {
    articleLabel: "READ STORY",
    articleCta: "Buka Catatan Redaksi",
  },
  contactEmail: "melodialam.ip@gmail.com",
  partnerEmail: "helfan@infia.co",
};

/* --- send ----------------------------------------------------------------- */

async function main() {
  const docs = [...articleDocs, ...playlistDocs, ...interviewDocs, settingsDoc];

  console.log(`  artikel   : ${articleDocs.length}`);
  console.log(`  playlist  : ${playlistDocs.length}`);
  console.log(`  wawancara : ${interviewDocs.length}`);
  console.log(`  setelan   : 1`);
  console.log(`  total     : ${docs.length} dokumen\n`);

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

main()
  .catch((error) => {
    console.error(error instanceof Error ? `  ${error.message}` : error);
    process.exitCode = 1;
  })
  .finally(() => {
    // The tsc output is throwaway; remove it so it cannot confuse a later lint
    // run (the compiled JS trips no-require-imports).
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
  });
