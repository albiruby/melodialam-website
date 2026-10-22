/**
 * Idempotency keys for the demo submission.
 *
 * A visitor who presses "Kirim" twice, or whose connection drops and whose
 * browser retries, should not become two rows in the queue. The client sends
 * an `Idempotency-Key` header; the same key always produces the same answer.
 *
 * Like the rate limiter, this lives in the memory of the running function, so
 * it is per instance rather than global. That is enough for the retry case,
 * which is the one that actually happens to people.
 */

/** What a key was answered with, and when that answer may be forgotten. */
interface Remembered {
  at: number;
  status: number;
  body: unknown;
}

const answers = new Map<string, Remembered>();

/** A forgotten key stops being remembered after a day. */
const TTL_MS = 24 * 60 * 60 * 1000;

/** How many keys are remembered at once. */
const MAX_KEYS = 5_000;

/**
 * The answer this key was given before, if it was given one.
 *
 * The key is normalised: long or strange values are ignored rather than
 * stored, so a caller cannot fill the map with junk.
 */
export function recall(key: string | null): { status: number; body: unknown } | null {
  if (!key) return null;
  const normalized = key.trim();
  if (!normalized || normalized.length > 200) return null;

  const remembered = answers.get(normalized);
  if (!remembered) return null;

  if (Date.now() - remembered.at > TTL_MS) {
    answers.delete(normalized);
    return null;
  }

  return { status: remembered.status, body: remembered.body };
}

/**
 * Remember the answer for this key, so the same call does not do the work
 * twice.
 */
export function remember(key: string | null, status: number, body: unknown): void {
  if (!key) return;
  const normalized = key.trim();
  if (!normalized || normalized.length > 200) return;

  if (answers.size > MAX_KEYS) {
    const oldest = answers.keys().next();
    if (!oldest.done) answers.delete(oldest.value);
  }

  answers.set(normalized, { at: Date.now(), status, body });
}
