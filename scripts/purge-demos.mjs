/**
 * Delete demo submissions — and everything attached to them.
 *
 * Why: deleting a `demoSubmission` in the Studio leaves two things behind. The
 * `demoContact` document still holds the manager's WhatsApp or email, and the
 * audio file still sits in Blob storage where it stays public forever. Both are
 * personal data; a delete that leaves them is not a delete.
 *
 * What it does:
 *   1. removes `demoContact` documents whose submission no longer exists
 *      (deleted in the Studio, or left behind by an older run),
 *   2. per submission older than the cutoff: deletes the audio object (needs
 *      BLOB_READ_WRITE_TOKEN), then the `demoContact` document, then the
 *      submission itself.
 *
 * Two rules keep the cleanup honest:
 *   - **Retention.** `SHORTLISTED (SAMSARA)` and `APPROVED (ARTICLE)` are kept
 *     because the privacy page says a work is stored while it is used for
 *     coverage. Pass `--include-approved` to purge them too.
 *   - **Fail closed.** A submission is deleted only after its audio and its
 *     contact are gone. If either step fails (or the Blob token is missing
 *     while an audio URL exists), the row is left intact so the run can be
 *     retried. A failed contact delete never takes the submission with it.
 *
 * Dry run by default. Nothing is removed until `--apply` is passed:
 *
 *   npm run purge-demos -- --days=180            # lihat apa yang akan dihapus
 *   npm run purge-demos -- --days=180 --apply    # hapus sungguhan
 *   npm run purge-demos -- --days=180 --include-approved --apply
 *
 * There is no automatic retention policy yet — that is the owner's call. This
 * script is the mechanism; the number is a decision.
 */
import fs from "node:fs";
import { del } from "@vercel/blob";

const API = "https://03sgar5q.api.sanity.io/v2026-05-19";
const DATASET = "submissions";

/** The two outcomes a curator approved; retained unless explicitly included. */
const RETAINED_STATUSES = new Set(["SHORTLISTED (SAMSARA)", "APPROVED (ARTICLE)"]);

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const includeApproved = args.includes("--include-approved");
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
console.log(
  includeApproved
    ? "Status disetujui ikut dihapus (--include-approved)."
    : "Status SHORTLISTED/APPROVED dipertahankan (pakai --include-approved untuk ikut menghapus).",
);
if (!blobToken) console.log("BLOB_READ_WRITE_TOKEN tidak ada — kiriman ber-audio akan dilewati, bukan dihapus sebagian.");

async function query(groq) {
  const res = await fetch(`${API}/data/query/${DATASET}?query=${encodeURIComponent(groq)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(JSON.stringify(json.error ?? res.status).slice(0, 200));
  return json.result ?? [];
}

async function mutate(mutations) {
  const res = await fetch(`${API}/data/mutate/${DATASET}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ mutations }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`mutate ${res.status}: ${body.slice(0, 160)}`);
  }
}

const old = await query(
  `*[_type == "demoSubmission" && submittedAt < "${cutoffDate}"] | order(submittedAt asc) {
    _id, artist, title, submittedAt, status, audioUrl
  }`,
);

const purgeable = old.filter((row) => includeApproved || !RETAINED_STATUSES.has(row.status));
const retained = old.length - purgeable.length;

console.log(`\nKiriman lebih lama dari ${days} hari: ${old.length}`);
console.log(`  akan dihapus: ${purgeable.length} · dipertahankan (disetujui): ${retained}`);
for (const row of purgeable) {
  console.log(`  ${row.submittedAt} · ${row.artist ?? "?"} — ${row.title ?? "?"} [${row.status ?? "?"}]${row.audioUrl ? " (ada audio)" : ""}`);
}

// Contacts whose submission is already gone. `submission->` is null when the
// referenced document no longer exists, so these are the PII left behind by a
// Studio delete (or by a run that removed the submission without the contact).
const orphanContacts = await query(
  `*[_type == "demoContact" && !defined(submission->)]{ _id }`,
);
console.log(`\nKontak yatim (submission sudah tidak ada): ${orphanContacts.length}`);

if (!purgeable.length && !orphanContacts.length) {
  console.log("\nTidak ada yang perlu dihapus.");
  process.exit(0);
}
if (!apply) {
  console.log("\nDry run. Jalankan lagi dengan --apply untuk menghapus.");
  process.exit(0);
}

let removed = 0;
let orphanRemoved = 0;
const failed = [];

if (orphanContacts.length) {
  try {
    await mutate(orphanContacts.map((c) => ({ delete: { id: c._id } })));
    orphanRemoved = orphanContacts.length;
    console.log(`  kontak yatim dihapus: ${orphanRemoved}`);
  } catch (error) {
    failed.push({ id: "orphan-contacts", reason: String(error).slice(0, 160) });
    console.warn("  kontak yatim gagal dihapus:", String(error).slice(0, 160));
  }
}

for (const row of purgeable) {
  let blocked = "";

  // 1. Audio first: once the submission row is gone, its audioUrl is gone too.
  if (row.audioUrl) {
    if (!blobToken) {
      blocked = "BLOB_READ_WRITE_TOKEN tidak ada; audio belum dihapus";
    } else {
      try {
        await del(row.audioUrl, { token: blobToken });
      } catch (error) {
        blocked = `audio gagal dihapus: ${String(error).slice(0, 120)}`;
      }
    }
  }

  // 2. Contact, checked: a failed delete must not orphan the PII.
  if (!blocked) {
    const contacts = await query(
      `*[_type == "demoContact" && references("${row._id}")]{ _id }`,
    );
    if (contacts.length) {
      try {
        await mutate(contacts.map((c) => ({ delete: { id: c._id } })));
      } catch (error) {
        blocked = `kontak gagal dihapus: ${String(error).slice(0, 120)}`;
      }
    }
  }

  // 3. The submission, only after both derived copies are gone.
  if (!blocked) {
    try {
      await mutate([{ delete: { id: row._id } }]);
    } catch (error) {
      blocked = `submission gagal dihapus: ${String(error).slice(0, 120)}`;
    }
  }

  if (blocked) {
    failed.push({ id: row._id, reason: blocked });
    console.warn(`  DILEWATI ${row._id}: ${blocked}`);
    continue;
  }
  removed++;
  console.log(`  dihapus: ${row._id}`);
}

console.log(
  `\nSelesai. ${removed} kiriman dihapus, ${orphanRemoved} kontak yatim dihapus, ${retained} disetujui dipertahankan.`,
);
if (failed.length) {
  console.error(`${failed.length} langkah gagal; kiriman terkait tidak dihapus:`);
  for (const f of failed) console.error(`  - ${f.id}: ${f.reason}`);
  process.exit(1);
}
