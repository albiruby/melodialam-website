/**
 * Export both Sanity datasets to disk.
 *
 * Why: the content lives in a service we do not back up ourselves. A wrong
 * delete in the Studio, or a bad migration, would otherwise be final — the
 * site would fall back to the static copy in `lib/content-fallback.ts`, which
 * is deliberately not a mirror of the current content.
 *
 * What it writes: one NDJSON file per dataset, as Sanity's own export endpoint
 * streams it, into `backups/<date>/`. The folder is gitignored: the
 * `submissions` export holds the demo queue and the manager contacts, so it must
 * never be committed.
 *
 * Run it with `npm run backup` (needs `SANITY_API_READ_TOKEN` in `.env`), then
 * move the folder somewhere off this machine — a backup on the same disk as the
 * project is not a backup.
 *
 * Scheduling: there is no cron in this repo. A GitHub Action or a machine-level
 * task can run this command weekly; the token would have to come from a secret
 * store, not from `.env`.
 */
import fs from "node:fs";
import path from "node:path";

const API = "https://03sgar5q.api.sanity.io/v2021-03-31";
const DATASETS = ["production", "submissions"];

const envPath = path.join(process.cwd(), ".env");
const token = fs.existsSync(envPath)
  ? fs.readFileSync(envPath, "utf8").match(/^SANITY_API_READ_TOKEN=(.*)$/m)?.[1]?.trim()
  : process.env.SANITY_API_READ_TOKEN;

if (!token) {
  console.error("SANITY_API_READ_TOKEN tidak ditemukan. Isi .env lalu jalankan lagi.");
  process.exit(1);
}

const date = new Date().toISOString().slice(0, 10);
const outDir = path.join(process.cwd(), "backups", date);
fs.mkdirSync(outDir, { recursive: true });

let failed = 0;

for (const dataset of DATASETS) {
  const url = `${API}/data/export/${dataset}`;
  process.stdout.write(`${dataset.padEnd(12)} … `);

  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      console.log(`GAGAL (${res.status})`);
      failed++;
      continue;
    }

    const body = await res.text();
    const lines = body.split("\n").filter(Boolean).length;
    const file = path.join(outDir, `${dataset}.ndjson`);
    fs.writeFileSync(file, body);

    const size = (fs.statSync(file).size / 1024 / 1024).toFixed(1);
    console.log(`${lines} dokumen, ${size} MB → ${path.relative(process.cwd(), file)}`);
  } catch (error) {
    console.log(`GAGAL (${String(error).slice(0, 80)})`);
    failed++;
  }
}

console.log(
  failed ? `\n${failed} dataset gagal.` : `\nSelesai. Pindahkan ${path.relative(process.cwd(), outDir)} ke luar mesin ini.`,
);
process.exit(failed ? 1 : 0);
