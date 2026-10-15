import { createClient } from "next-sanity";
import { SANITY_API_VERSION } from "./sanity";
import { SANITY_PROJECT_ID, SANITY_SUBMISSIONS_DATASET } from "./sanity-project";

/**
 * Server-only access to the PRIVATE `submissions` dataset.
 *
 * Everything in here needs `SANITY_API_READ_TOKEN`. That dataset holds the demo
 * queue and, separately, the manager contact details for each submission, and it
 * is private precisely so no anonymous reader can reach them — verified: an
 * unauthenticated query against it returns `null` for documents that the same
 * query returns with the token.
 *
 * Never import this from a client component. The token would ship to the browser,
 * and with it every contact detail in the queue.
 *
 * The token is the only thing here that comes from the environment. Without it
 * there is no legitimate way to reach this dataset, so the client is null and
 * `app/api/demos/route.ts` falls back to its in-memory queue.
 */

const token = process.env.SANITY_API_READ_TOKEN;

export const submissionsClient = token
  ? createClient({
      projectId: SANITY_PROJECT_ID,
      dataset: SANITY_SUBMISSIONS_DATASET,
      apiVersion: SANITY_API_VERSION,
      useCdn: false,
      perspective: "published",
      token,
    })
  : null;

/** True when the demo queue is backed by Sanity rather than process memory. */
export const demoStoreConfigured = submissionsClient !== null;
