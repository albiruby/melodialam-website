import { NextResponse } from "next/server";
import {
  DEMO_AUDIO_EXTENSIONS,
  DEMO_AUDIO_MAX_BYTES,
  DEMO_GENRES,
  DEMO_INITIAL_STATUS,
  DEMO_PROGRAMS,
  SEED_DEMOS,
  type DemoStatus,
  type DemoSubmission,
} from "@/lib/content";
import { DEMO_APPROVED_STATUSES } from "@/collections/DemoSubmissions";
import { getPayloadClient } from "@/lib/payload";

/**
 * Demo queue. Two stores behind one contract:
 *
 * - DATABASE_URL set: Postgres via Payload. Reads return approved rows only
 *   (moderated queue, ADR-0005); writes go through the validation below and
 *   land as IN REVIEW with the contact in its own table.
 * - DATABASE_URL absent: the original process-local array seeded from
 *   SEED_DEMOS. A fresh checkout keeps working with no credentials.
 *
 * The response shapes are identical either way.
 */

type QueuedDemo = DemoSubmission;

const memoryQueue: QueuedDemo[] = [...SEED_DEMOS];

/** Mirrors the target schema until the database owns it. */
const memoryContacts = new Map<string, string>();

const MAX_FIELD = 500;

/** The whole submission is a few kilobytes of text; anything larger is abuse. */
const MAX_BODY_BYTES = 16 * 1024;

interface PayloadBody {
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
}

function str(value: unknown, max = MAX_FIELD): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function id(): string {
  return `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function toPublicRow(doc: {
  id: string | number;
  artist: string;
  city: string;
  title: string;
  genre?: string | null;
  program?: string | null;
  link: string;
  story: string;
  status: string;
  createdAt: string;
}): QueuedDemo {
  return {
    id: String(doc.id),
    artist: doc.artist,
    city: doc.city,
    title: doc.title,
    genre: doc.genre ?? "",
    program: doc.program ?? "",
    link: doc.link,
    story: doc.story,
    status: doc.status as DemoStatus,
    submittedAt: new Date(doc.createdAt).toISOString().slice(0, 10),
  };
}

export async function GET() {
  const payload = await getPayloadClient();
  if (!payload) {
    return NextResponse.json({ queue: memoryQueue, count: memoryQueue.length });
  }

  const found = await payload.find({
    collection: 'demo-submissions',
    where: { status: { in: [...DEMO_APPROVED_STATUSES] } },
    sort: '-createdAt',
    limit: 100,
    overrideAccess: true,
  });

  // Payload types its docs generically; the shape is ours by construction.
  type SubmissionDoc = Parameters<typeof toPublicRow>[0];
  const docs = found.docs as unknown as SubmissionDoc[];

  return NextResponse.json({
    queue: docs.map(toPublicRow),
    count: found.totalDocs,
  });
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Kiriman terlalu besar." }, { status: 413 });
  }

  let body: PayloadBody;
  try {
    body = JSON.parse(raw) as PayloadBody;
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
  const audioSize = typeof body.audioSize === "number" ? body.audioSize : 0;

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

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Periksa kembali isian formulir.", errors }, { status: 422 });
  }

  const payload = await getPayloadClient();

  // No database: the original in-memory path. The contact goes into its own
  // map, never into the row the public queue reads.
  if (!payload) {    const entry: QueuedDemo = {
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
      submittedAt: new Date().toISOString().slice(0, 10),
    };
    memoryContacts.set(entry.id, contact);
    memoryQueue.unshift(entry);

    return NextResponse.json(
      {
        ok: true,
        entry,
        queueLength: memoryQueue.length,
        note: "Kontak manajer tersimpan terpisah dan tidak tampil di antrean publik.",
      },
      { status: 201 },
    );
  }

  const created = await payload.create({
    collection: 'demo-submissions',
    data: {
      artist,
      city,
      title,
      // Validated against the enums above, so the narrowing below is exact.
      genre: (DEMO_GENRES as readonly string[]).includes(genre)
        ? (genre as (typeof DEMO_GENRES)[number])
        : undefined,
      program: (DEMO_PROGRAMS as readonly string[]).includes(program)
        ? (program as (typeof DEMO_PROGRAMS)[number])
        : undefined,
      link,
      story,
      status: DEMO_INITIAL_STATUS,
    },
    overrideAccess: true,
  });

  await payload.create({
    collection: 'demo-contacts',
    data: {
      submission: created.id,
      contact,
    },
    overrideAccess: true,
  });

  const entry = toPublicRow({
    id: created.id,
    artist: created.artist,
    city: created.city,
    title: created.title,
    genre: created.genre,
    program: created.program,
    link: created.link,
    story: created.story,
    status: created.status,
    createdAt: created.createdAt,
  });

  const approved = await payload.count({
    collection: 'demo-submissions',
    where: { status: { in: [...DEMO_APPROVED_STATUSES] } },
    overrideAccess: true,
  });

  return NextResponse.json(
    {
      ok: true,
      entry,
      queueLength: approved.totalDocs,
      note: "Kontak manajer tersimpan terpisah dan tidak tampil di antrean publik.",
    },
    { status: 201 },
  );
}
