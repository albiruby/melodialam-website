import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const workspaceRoot = path.resolve(projectRoot, "..");

const SOURCE_CANDIDATES = [
  path.join(workspaceRoot, "melodi-alam-data.md"),
  path.join(projectRoot, "melodi-alam-data.md"),
];

const source = SOURCE_CANDIDATES.find((p) => fs.existsSync(p));
if (!source) {
  console.error(
    `Could not find melodi-alam-data.md. Looked in:\n  ${SOURCE_CANDIDATES.join("\n  ")}`,
  );
  process.exit(1);
}

const OUT = path.join(projectRoot, "lib", "catalogue.json");

const md = fs.readFileSync(source, "utf8");
const lines = md.split("\n");

// Markdown escapes an in-cell pipe as \| — split only on unescaped pipes.
const SPLIT = /(?<!\\)\|/;
const unescape = (s) => s.replace(/\\\|/g, "|").trim();
const linkOf = (cell) => cell.match(/\((https?:\/\/[^)]+)\)/)?.[1] ?? null;

/** Strips markdown decoration so a cell becomes a plain value. */
function plain(cell) {
  return cell
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // [label](href) -> label
    .replace(/[`*]/g, "") // `code`, *em*
    .trim();
}

function toSeconds(dur) {
  if (!dur) return 0;
  const parts = dur.split(":").map(Number);
  if (parts.some(Number.isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function ageBucket(age) {
  const m = (age || "").match(/^(\d+)\s*(d|w|mo|y)\s*ago$/);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2];
  if (unit === "d") return "0-30d";
  if (unit === "w") return "1-3mo";
  if (unit === "mo") return n >= 12 ? "1y+" : `${n}mo`;
  return n >= 4 ? "4y+" : `${n}y`;
}

/**
 * "Live At Melodi Samsara" / "Live At Melodi Taman" name the two venues behind
 * Melodi Alam's own live formats. Everything else is an interview episode or an
 * archived upload (festival aftermovie, older series).
 */
function venueFor(title) {
  if (/live at melodi taman/i.test(title)) return "Melodi Taman";
  if (/live at melodi samsara/i.test(title)) return "Melodi Samsara";
  if (/\bbicara melodi\b|\bmelody talk\b|\btalking melodies\b|\bresonan(?:ce|si)\b/i.test(title)) {
    return "Interview";
  }
  return "Arsip & Lainnya";
}

const videos = [];
const shorts = [];
const playlists = [];
/** Channel facts lifted from the "## 1. Profil" table in the scrape. */
const profile = {};
let section = null;

for (const line of lines) {
  if (line.startsWith("## ")) {
    section = line;
    continue;
  }
  if (!/^\|\s*\d+\s*\|/.test(line)) continue;

  const raw = line.split(SPLIT);
  // raw[0] is empty (leading pipe) and raw.at(-1) is empty (trailing pipe).
  const c = raw.slice(1, -1).map(unescape);

  if (/^## 4\./.test(section ?? "") && c.length === 7) {
    const [, title, duration, views, uploaded, feat, linkCell] = c;
    const url = linkOf(linkCell);
    const id = url?.match(/v=([\w-]{11})/)?.[1];
    if (!id) continue;
    videos.push({
      id,
      title,
      venue: venueFor(title),
      duration,
      seconds: toSeconds(duration),
      views,
      uploaded,
      ageBucket: ageBucket(uploaded),
      featuring: feat === "-" ? [] : feat.split(",").map((s) => s.trim()).filter(Boolean),
      url,
    });
  }

  if (/^## 5\./.test(section ?? "") && c.length === 4) {
    const [, title, views, linkCell] = c;
    const url = linkOf(linkCell);
    const id = url?.match(/shorts\/([\w-]{11})/)?.[1];
    if (!id) continue;
    shorts.push({ id, title, views, url });
  }

  if (/^## 3\./.test(section ?? "") && c.length === 4) {
    const [, title, count, linkCell] = c;
    const url = linkOf(linkCell);
    const id = url?.match(/list=([\w-]+)/)?.[1];
    if (!id) continue;
    playlists.push({ id, title, count, url });
  }
}

// --- Section 1: profile facts -------------------------------------------
// Shape: | Platform | Metrik | Nilai |
for (const line of lines) {
  if (!/^\|\s*(YouTube|Instagram|Linktree)\s*\|/.test(line)) continue;
  const raw = line.split(SPLIT);
  if (raw.length < 5) continue;
  const [platform, metric, valueCell] = [raw[1], raw[2], raw[3]].map(unescape);
  if (!metric || !valueCell) continue;
  const key = `${platform.toLowerCase()}_${plain(metric)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")}`;
  profile[key] = {
    platform,
    metric: plain(metric),
    value: plain(valueCell),
    href: linkOf(valueCell),
  };
}

const byVenue = {};
for (const v of videos) byVenue[v.venue] = (byVenue[v.venue] ?? 0) + 1;

const pick = (key) => profile[key]?.value ?? null;

/** The scrape timestamp lives in the header blockquote, not the profile table. */
const scrapedAt =
  md.match(/Waktu scrape:\s*\**\s*([^.*\n]+?)\s*\**\s*\./i)?.[1]?.trim() ?? null;

const payload = {
  meta: {
    channelId: pick("youtube_channel_id"),
    channelName: pick("youtube_nama_channel"),
    handle: (profile.youtube_handle?.value ?? "").replace(/^@/, "") || null,
    handleUrl: profile.youtube_handle?.href ?? null,
    subscribers: pick("youtube_subscriber"),
    totalViews: pick("youtube_total_views_channel"),
    declaredVideos: Number(pick("youtube_total_video_milik_channel")) || null,
    joined: pick("youtube_tanggal_join"),
    country: pick("youtube_negara"),
    instagramFollowers: pick("instagram_followers"),
    instagramPosts: pick("instagram_jumlah_post"),
    scrapedAt,
  },
  profile,
  counts: { videos: videos.length, shorts: shorts.length, playlists: playlists.length, byVenue },
  videos,
  shorts,
  playlists,
};

fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");

console.log(`source : ${source}`);
console.log(`videos : ${videos.length}`);
console.log(`shorts : ${shorts.length}`);
console.log(`lists  : ${playlists.length}`);
console.log(`venues : ${JSON.stringify(byVenue)}`);
console.log(`facts  : ${Object.keys(profile).length} profile rows parsed`);
console.log("meta   :");
for (const [k, v] of Object.entries(payload.meta)) {
  console.log(`           ${k.padEnd(20)} = ${v ?? "(null)"}`);
}
console.log(`written: ${OUT} (${fs.statSync(OUT).size} bytes)`);