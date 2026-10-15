import { createClient } from "next-sanity";
import { SANITY_API_VERSION } from "./sanity";

/**
 * Server-only access to the PRIVATE `submissions` dataset.
 *
 * Everything in here needs `SANITY_API_READ_TOKEN`. That dataset holds the demo
 * queue and, separately, the manager contact details for each submission, and
 * it is private precisely so no anonymous reader can reach them — verified: an
 * unauthenticated query against it returns `null` for documents that the same
 * query returns with the token.
 *
 * Never import this from a client component. The token would ship to the
 * browser, and with it every contact detail in the queue.
 */

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const submissionsDataset = process.env.NEXT_PUBLIC_SANITY_SUBMISSIONS_DATASET;
const token = process.env.SANITY_API_READ_TOKEN;

/**
 * Null when the token or dataset is absent, which is the normal state on a
 * fresh checkout. Callers fall back to the in-memory queue.
 */
export const submissionsClient =
  projectId && submissionsDataset && token
    ? createClient({
        projectId,
        dataset: submissionsDataset,
        apiVersion: SANITY_API_VERSION,
        useCdn: false,
        perspective: "published",
        token,
      })
    : null;

/** True when the demo queue is backed by Sanity rather than process memory. */
export const demoStoreConfigured = submissionsClient !== null;
