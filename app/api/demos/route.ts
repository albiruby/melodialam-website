import { NextResponse } from "next/server";
import { DEMO_GENRES, DEMO_PROGRAMS, SEED_DEMOS, type DemoSubmission } from "@/lib/content";

/**
 * In-memory queue for demo submissions.
 *
 * A process-local array is the honest default here: it survives across requests
 * within a single server instance and resets on restart. Swap the store for a
 * database or a queue before running this in production — the validation below
 * is what matters at the boundary.
 */

const queue: DemoSubmission[] = [...SEED_DEMOS];

const MAX_FIELD = 500;

interface Payload {
  artist?: unknown;
  city?: unknown;
  title?: unknown;
  genre?: unknown;
  program?: unknown;
  link?: unknown;
  contact?: unknown;
  story?: unknown;
}

function str(value: unknown, max = MAX_FIELD): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function id(): string {
  return `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET() {
  return NextResponse.json({ queue, count: queue.length });
}

export async function POST(request: Request) {
  let body: Payload;
  try {
    body = (await request.json()) as Payload;
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

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Periksa kembali isian formulir.", errors }, { status: 422 });
  }

  const entry: DemoSubmission = {
    id: id(),
    artist,
    city,
    title,
    genre,
    program,
    link,
    story,
    status: "NEW SUBMISSION • JUST NOW",
    submittedAt: new Date().toISOString().slice(0, 10),
  };

  // Newest first, matching the original UI.
  queue.unshift(entry);

  // Surface the manager contact to curators rather than the public queue.
  return NextResponse.json(
    {
      ok: true,
      entry,
      queueLength: queue.length,
      note: `Kontak manajer (${contact}) dicatat terpisah dan tidak tampil di daftar publik.`,
    },
    { status: 201 },
  );
}