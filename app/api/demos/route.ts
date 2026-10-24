import { NextResponse } from "next/server";
import {
  DEMO_APPROVED_STATUSES,
  DEMO_AUDIO_EXTENSIONS,
  DEMO_AUDIO_MAX_BYTES,
  DEMO_GENRES,
  DEMO_INITIAL_STATUS,
  DEMO_PROGRAMS,
  SEED_DEMOS,
  type DemoStatus,
  type DemoSubmission,
} from "@/lib/content-fallback";
import { recall, remember } from "@/lib/idempotency";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { submissionsClient } from "@/lib/sanity-server";

/**
 * Demo queue. Two stores behind one contract:
 *
 * - Sanity configured: the PRIVATE `submissions` dataset. Reads return approved
 *   rows only (moderated queue, ADR-0005); writes go through the validation
 *   below and land as IN REVIEW, with the manager contact in its own document
 *   type so it never travels with the row the public queue reads.
 * - Not configured: the original process-local array seeded from SEED_DEMOS, so
 *   a fresh checkout keeps working with no credentials.
 *
 * The response shapes are identical either way.
 */

type QueuedDemo = DemoSubmission;

const memoryQueue: QueuedDemo[] = [...SEED_DEMOS];

/** Mirrors the target schema until the CMS owns it. */
const memoryContacts = new Map<string, string>();

const MAX_FIELD = 500;

/** The whole submission is a few kilobytes of text; anything larger is abuse. */
const MAX_BODY_BYTES = 16 * 1024;

/**
 * How many submissions one client may send, and over which window.
 *
 * A band sends a few demos, not dozens, so five an hour is generous for a
 * person and hostile to a script.
 */
const DEMO_SUBMISSIONS_PER_WINDOW = 5;
const DEMO_WINDOW_MS = 60 * 60 * 1000;

interface DemoBody {
  artist?: unknown;
  city?: unknown;
  title?: unknown;
  genre?: unknown;
  program?: unknown;
  link?: unknown;
  contact?: unknown;
  story?: unknown;
  audioName?: unknown;
  audioSize?: unknown;
  audioUrl?: unknown;
  /** Honeypot. Always empty for a real visitor; never rendered. */
  companyRegistration?: unknown;
}

function str(value: unknown, max = MAX_FIELD): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * The size of the uploaded audio, in bytes.
 *
 * The form sends a number, but a crafted body may send the same figure as a
 * string. Both are read, because a size that silently arrives as zero would
 * turn the 25 MB check below into a check that never fires.
 */
function bytes(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value.trim());
  return 0;
}

/**
 * Whether a URL points at a file in our own Vercel Blob store.
 *
 * The browser uploads the demo audio straight to Blob, so the only legitimate
 * host is the one Blob hands back. Both the public and the private store
 * hostname end in `.blob.vercel-storage.com`.
 */
function isOwnBlobUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  return url.hostname.endsWith(".blob.vercel-storage.com");
}

function id(): string {
  return `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Shape returned by the queue query, before it is narrowed to `QueuedDemo`. */
interface QueueRow {
  id: string;
  artist: string;
  city: string;
  title: string;
  genre: string | null;
  program: string | null;
  link: string;
  story: string;
  status: string;
  submittedAt: string;
}

function toPublicRow(doc: QueueRow): QueuedDemo {
  return {
    id: doc.id,
    artist: doc.artist,
    city: doc.city,
    title: doc.title,
    genre: doc.genre ?? "",
    program: doc.program ?? "",
    link: doc.link,
    story: doc.story,
    status: doc.status as DemoStatus,
    submittedAt: doc.submittedAt,
  };
}

const APPROVED_QUERY = /* groq */ `*[_type == "demoSubmission" && status in $approved] | order(submittedAt desc)[0...100] {
  "id": _id,
  artist,
  city,
  title,
  genre,
  program,
  link,
  story,
  status,
  submittedAt
}`;

const APPROVED_COUNT_QUERY = /* groq */ `count(*[_type == "demoSubmission" && status in $approved])`;

export async function GET() {
  // The public queue is moderated: only rows a curator has approved are
  // readable. Without a token the fallback used to hand back the whole queue,
  // including IN REVIEW rows — the same rule has to hold on both paths.
  const approvedStatuses: readonly string[] = DEMO_APPROVED_STATUSES;
  const approved = (row: QueuedDemo) => approvedStatuses.includes(row.status);

  if (!submissionsClient) {
    const queue = memoryQueue.filter(approved);
    return NextResponse.json({ queue, count: queue.length });
  }

  try {
    const rows = await submissionsClient.fetch<QueueRow[]>(
      APPROVED_QUERY,
      { approved: [...DEMO_APPROVED_STATUSES] },
      { cache: "no-store" },
    );

    return NextResponse.json({ queue: rows.map(toPublicRow), count: rows.length });
  } catch {
    // The queue is a convenience, not a page: fall back rather than 500.
    const queue = memoryQueue.filter(approved);
    return NextResponse.json({ queue, count: queue.length });
  }
}

/**
 * Optional email notification for a new submission.
 *
 * Inert until `RESEND_API_KEY` exists. The form must never fail because a
 * notification could not go out, so the call is awaited (a serverless function
 * may stop the moment it responds) and every error is logged and swallowed.
 * Destination defaults to the two partnership addresses; override with
 * `DEMO_NOTIFY_TO`, sender with `DEMO_NOTIFY_FROM`.
 */
async function notifyNewSubmission(entry: {
  artist: string;
  city: string;
  title: string;
  genre: string;
  program: string;
  link: string;
  contact: string;
  story: string;
  audioName: string;
  audioUrl: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;

  const to = (process.env.DEMO_NOTIFY_TO ?? "melodialam.ip@gmail.com,helfan@infia.co")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
  const from = process.env.DEMO_NOTIFY_FROM ?? "Melodi Alam <onboarding@resend.dev>";

  const text = [
    `Artis     : ${entry.artist}`,
    `Kota      : ${entry.city}`,
    `Judul     : ${entry.title}`,
    entry.genre ? `Genre     : ${entry.genre}` : "",
    entry.program ? `Program   : ${entry.program}` : "",
    `Link      : ${entry.link}`,
    `Kontak    : ${entry.contact}`,
    entry.audioUrl ? `Audio     : ${entry.audioName} — ${entry.audioUrl}` : "",
    "",
    entry.story,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        subject: `Demo baru: ${entry.artist} — ${entry.title}`,
        text,
      }),
    });
    if (!response.ok) {
      console.error(
        "[api/demos] notifikasi email gagal:",
        response.status,
        (await response.text()).slice(0, 200),
      );
    }
  } catch (error) {
    console.error("[api/demos] notifikasi email gagal:", error);
  }
}

export async function POST(request: Request) {
  // A repeated send carries the same key and gets the same answer, so a retry
  // never becomes a second row. This is checked before the rate limit, because
  // a retry is not a new submission.
  const idempotencyKey = request.headers.get("idempotency-key");
  const remembered = recall(idempotencyKey);
  if (remembered) {
    return NextResponse.json(remembered.body, { status: remembered.status });
  }

  // F02: this is the one endpoint anyone may call without a secret. Each
  // accepted call costs a Sanity write and, once Resend is connected, a paid
  // email, so the number of calls per client is capped.
  const limit = rateLimit(`demos:${clientIp(request)}`, DEMO_SUBMISSIONS_PER_WINDOW, DEMO_WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak kiriman dari alamat ini. Coba lagi nanti." },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    );
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Kiriman terlalu besar." }, { status: 413 });
  }

  let body: DemoBody;
  try {
    const parsed: unknown = JSON.parse(raw);
    // `JSON.parse("null")` succeeds and hands back null, so a body of `null`
    // would reach the field reads below and crash the request.
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Body harus berupa objek JSON." }, { status: 400 });
    }
    body = parsed as DemoBody;
  } catch {
    return NextResponse.json({ error: "Body harus berupa JSON." }, { status: 400 });
  }

  const artist = str(body.artist, 120);
  const city = str(body.city, 80);
  const title = str(body.title, 160);
  const genre = str(body.genre, 60);
  const program = str(body.program, 80);
  const link = str(body.link, 500);
  const contact = str(body.contact, 160);
  const story = str(body.story, 2000);
  const audioName = str(body.audioName, 200);
  const audioSize = bytes(body.audioSize);
  const audioUrl = str(body.audioUrl, 500);

  // The honeypot. A real visitor never sees this field and never fills it;
  // a script that fills every field it finds does. The answer looks like
  // success and nothing is written, so the script learns nothing.
  if (str(body.companyRegistration, 200)) {
    console.warn("[api/demos] kiriman dibuang karena honeypot terisi.");
    return NextResponse.json(
      {
        ok: true,
        entry: { id: id(), artist, city, title, genre, program, link, story, status: DEMO_INITIAL_STATUS, submittedAt: new Date().toISOString().slice(0, 10) },
        queueLength: 0,
        note: "Kontak manajer tersimpan terpisah dan tidak tampil di antrean publik.",
      },
      { status: 201 },
    );
  }

  const errors: Record<string, string> = {};
  if (!artist) errors.artist = "Nama band atau solois wajib diisi.";
  if (!city) errors.city = "Kota asal wajib diisi.";
  if (!title) errors.title = "Judul lagu atau EP wajib diisi.";
  if (!story) errors.story = "Cerita singkat wajib diisi.";
  if (!contact) errors.contact = "Kontak manajer wajib diisi.";
  if (!link) errors.link = "Link streaming atau EPK wajib diisi.";
  else if (!/^https?:\/\/.+/i.test(link)) errors.link = "Link harus diawali http:// atau https://.";

  if (genre && !DEMO_GENRES.includes(genre as (typeof DEMO_GENRES)[number])) {
    errors.genre = "Genre tidak dikenal.";
  }
  if (program && !DEMO_PROGRAMS.includes(program as (typeof DEMO_PROGRAMS)[number])) {
    errors.program = "Program tujuan tidak dikenal.";
  }

  // BR-001. The browser blocks a bad file before it is ever previewed; this
  // catches a crafted request that reports metadata it could not produce.
  if (audioName) {
    const lower = audioName.toLowerCase();
    if (!DEMO_AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
      errors.audioName = `Format berkas harus ${DEMO_AUDIO_EXTENSIONS.join(", ")}.`;
    }
    if (audioSize > DEMO_AUDIO_MAX_BYTES) {
      errors.audioName = "Ukuran berkas melebihi batas 25 MB.";
    }
  }

  // The file is uploaded straight to Blob storage; the submission only carries
  // its URL. The URL has to point at our own Blob store, not merely at any
  // https address that ends in .mp3 — otherwise a crafted body could hand the
  // desk a link to somebody else's server and have it look like our upload.
  if (audioUrl) {
    const path = audioUrl.split("?")[0].toLowerCase();
    const allowed = DEMO_AUDIO_EXTENSIONS.some((ext) => path.endsWith(ext));
    if (!allowed || !isOwnBlobUrl(audioUrl)) {
      errors.audioUrl = "Tautan audio tidak dikenal.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Periksa kembali isian formulir.", errors }, { status: 422 });
  }

  const submittedAt = new Date().toISOString().slice(0, 10);

  // No CMS: the original in-memory path. The contact goes into its own map,
  // never into the row the public queue reads.
  if (!submissionsClient) {
    const entry: QueuedDemo = {
      id: id(),
      artist,
      city,
      title,
      genre,
      program,
      link,
      story,
      // BR-002: a public submission can only ever be created as IN REVIEW.
      status: DEMO_INITIAL_STATUS,
      submittedAt,
    };
    memoryContacts.set(entry.id, contact);
    memoryQueue.unshift(entry);

    const responseBody = {
      ok: true,
      entry,
      queueLength: memoryQueue.length,
      note: "Kontak manajer tersimpan terpisah dan tidak tampil di antrean publik.",
    };
    remember(idempotencyKey, 201, responseBody);

    return NextResponse.json(responseBody, { status: 201 });
  }

  let createdId = "";
  try {
    const created = await submissionsClient.create({
      _type: "demoSubmission",
      artist,
      city,
      title,
      // Validated against the enums above, so these narrow exactly.
      ...(genre ? { genre } : {}),
      ...(program ? { program } : {}),
      link,
      story,
      status: DEMO_INITIAL_STATUS,
      submittedAt,
      ...(audioName ? { audioName } : {}),
      ...(audioUrl ? { audioUrl } : {}),
    });

    // The contact lives in its own document, in the same private dataset, so it
    // can never appear in a query that selects submission fields.
    await submissionsClient.create({
      _type: "demoContact",
      submission: { _type: "reference", _ref: created._id },
      contact,
    });
    createdId = created._id;
  } catch (error) {
    // A broken token or an unreachable dataset must not crash the public form.
    // Log the shape of the failure, not its raw message: the message can carry
    // the query, the document and whatever the transport decided to include.
    const failure = error as { name?: string; statusCode?: number };
    console.error("[api/demos] gagal menyimpan ke Sanity:", {
      name: failure?.name ?? "Error",
      status: failure?.statusCode ?? "tidak ada",
    });
    return NextResponse.json(
      { error: "Pengiriman demo sedang tidak bisa disimpan. Coba lagi nanti." },
      { status: 503 },
    );
  }

  // The row is stored; tell the desk. A failure here never changes the answer.
  await notifyNewSubmission({
    artist,
    city,
    title,
    genre,
    program,
    link,
    contact,
    story,
    audioName,
    audioUrl,
  });

  const entry = toPublicRow({
    id: createdId,
    artist,
    city,
    title,
    genre: genre || null,
    program: program || null,
    link,
    story,
    status: DEMO_INITIAL_STATUS,
    submittedAt,
  });

  let approvedCount = 0;
  try {
    approvedCount = await submissionsClient.fetch<number>(
      APPROVED_COUNT_QUERY,
      { approved: [...DEMO_APPROVED_STATUSES] },
      { cache: "no-store" },
    );
  } catch {
    // The submission is already stored; a failed count must not fail the request.
  }

  const responseBody = {
    ok: true,
    entry,
    queueLength: approvedCount,
    note: "Kontak manajer tersimpan terpisah dan tidak tampil di antrean publik.",
  };
  remember(idempotencyKey, 201, responseBody);

  return NextResponse.json(responseBody, { status: 201 });
}
