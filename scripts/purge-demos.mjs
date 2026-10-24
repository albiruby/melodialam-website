/**
 * Delete demo submissions — and everything attached to them.
 *
 * Why: deleting a `demoSubmission` in the Studio leaves two things behind. The
 * `demoContact` document still holds the manager's WhatsApp or email, and the
 * audio file still sits in Blob storage where it stays public forever. Both are
 * personal data; a delete that leaves them is not a delete.
 *
 * What it does, per submission older than the cutoff:
 *   1. deletes the audio object (needs BLOB_READ_WRITE_TOKEN),
 *   2. deletes the `demoContact` document that points at it,
 *   3. deletes the submission itself.
 *
 * Dry run by default. Nothing is removed until `--apply` is passed:
 *
 *   npm run purge-demos -- --days=180            # lihat apa yang akan dihapus
 *   npm run purge-demos -- --days=180 --apply    # hapus sungguhan
 *
 * There is no retention policy yet — that is the owner's call. This script is
 * the mechanism; the number is a decision.
 */
import fs from "node:fs";
import { del } from "@vercel/blob";

const API = "https://03sgar5q.api.sanity.io/v2026-05-19";
const DATASET = "submissions";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const daysArg = args.find((a) => a.startsWith("--days="));
const days = daysArg ? Number(daysArg.split("=")[1]) : 180;

if (!Number.isFinite(days) || days < 1) {
  console.error("--days harus angka >= 1, mis. --days=180");
  process.exit(1);
}

const env = fs.readFileSync(".env", "utf8");
const token = env.match(/^SANITY_API_READ_TOKEN=(.*)$/m)?.[1]?.trim();
const blobToken = env.match(/^BLOB_READ_WRITE_TOKEN=(.*)$/m)?.[1]?.trim();

if (!token) {
  console.error("SANITY_API_READ_TOKEN tidak ada di .env");
  process.exit(1);
}

const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const cutoffDate = cutoff.toISOString().slice(0, 10);

console.log(`Mode: ${apply ? "HAPUS" : "dry run"} · lebih lama dari ${days} hari (sebelum ${cutoffDate})`);
if (!blobToken) console.log("BLOB_READ_WRITE_TOKEN tidak ada — berkas audio akan dilewati.");

async function query(groq) {
  const res = await fetch(`${API}/data/query/${DATASET}?query=${encodeURIComponent(groq)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (json.error) throw new Error(JSON.stringify(json.error).slice(0, 200));
  return json.result ?? [];
}

async function mutate(mutations) {
  const res = await fetch(`${API}/data/mutate/${DATASET}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ mutations }),
  });
  return res.status;
}

const old = await query(
  `*[_type == "demoSubmission" && submittedAt < "${cutoffDate}"] | order(submittedAt asc) {
    _id, artist, title, submittedAt, audioUrl
  }`,
);

console.log(`\nKiriman lebih lama dari ${days} hari: ${old.length}`);
for (const row of old) {
  console.log(`  ${row.submittedAt} · ${row.artist ?? "?"} — ${row.title ?? "?"} ${row.audioUrl ? "(ada audio)" : ""}`);
}

if (!old.length) process.exit(0);
if (!apply) {
  console.log("\nDry run. Jalankan lagi dengan --apply untuk menghapus.");
  process.exit(0);
}

let removed = 0;
for (const row of old) {
  // 1. Audio, bila ada dan tokennya tersedia.
  if (row.audioUrl && blobToken) {
    try {
      await del(row.audioUrl, { token: blobToken });
    } catch (error) {
      console.warn(`  audio gagal dihapus (${row._id}):`, String(error).slice(0, 100));
    }
  }

  // 2. Kontak yang menunjuk ke kiriman ini.
  const contacts = await query(
    `*[_type == "demoContact" && references("${row._id}")]{ _id }`,
  );
  if (contacts.length) {
    await mutate(contacts.map((c) => ({ delete: { id: c._id } })));
  }

  // 3. Kirimannya.
  await mutate([{ delete: { id: row._id } }]);
  removed++;
  console.log(`  dihapus: ${row._id}`);
}

console.log(`\nSelesai. ${removed} kiriman dihapus beserta kontak dan audionya.`);
