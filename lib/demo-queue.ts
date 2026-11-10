/**
 * The public projection of a demo submission.
 *
 * ADR-0005 is explicit: the queue may publish only the band name, city, genre,
 * curation purpose and status — no EPK link, no song story, no contact. The
 * story is free text and the link can point anywhere, so neither belongs in an
 * anonymous response; contact already lives in its own document.
 *
 * `id` and `submittedAt` are structural: one keys the row, the other orders it.
 * Neither carries visitor-written content.
 */

import type { DemoStatus } from "./taxonomy";

/** A row as stored, before the public projection drops the private fields. */
export interface DemoQueueSource {
  id: string;
  artist: string;
  city: string;
  genre?: string | null;
  program?: string | null;
  status: string;
  submittedAt: string;
}

/** Exactly what `GET /api/demos` may return for one approved row. */
export interface PublicDemoRow {
  id: string;
  artist: string;
  city: string;
  genre: string;
  program: string;
  status: DemoStatus;
  submittedAt: string;
}

/** Keep the approved fields; drop everything else, including link and story. */
export function toPublicDemoRow(doc: DemoQueueSource): PublicDemoRow {
  return {
    id: doc.id,
    artist: doc.artist,
    city: doc.city,
    genre: doc.genre ?? "",
    program: doc.program ?? "",
    status: doc.status as DemoStatus,
    submittedAt: doc.submittedAt,
  };
}
