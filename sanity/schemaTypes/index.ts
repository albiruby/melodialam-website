import { article } from "./article";
import { demoContact } from "./demoContact";
import { demoSubmission } from "./demoSubmission";

/**
 * Two datasets, two schema sets, deliberately never mixed:
 *
 * - `contentSchemaTypes` → the public `production` dataset: editorial articles.
 * - `submissionSchemaTypes` → the private `submissions` dataset: demo queue rows
 *   and the manager contacts that must never be publicly readable.
 *
 * Keeping them apart is what lets the article reads stay tokenless and
 * CDN-cacheable while the PII stays behind the server token.
 */

export const contentSchemaTypes = [article];

export const submissionSchemaTypes = [demoSubmission, demoContact];
