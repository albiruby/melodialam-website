"use client";

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import {
  SANITY_DATASET,
  SANITY_PROJECT_ID,
  SANITY_SUBMISSIONS_DATASET,
} from "./lib/sanity-project";
import { contentSchemaTypes, submissionSchemaTypes } from "./sanity/schemaTypes";

/**
 * Two workspaces, one Studio.
 *
 * The split is not cosmetic: `production` is a public dataset, so its reads need
 * no token and can sit behind the CDN, while `submissions` is private and holds
 * musician contact details. A single workspace cannot span both.
 *
 * `basePath` is required per workspace once there is more than one, and it
 * governs the EMBEDDED Studio only — the hosted one uses the workspace name as
 * its path (/content, /submissions) and ignores this. Verified on both.
 *
 * The identifiers come from `lib/sanity-project.ts` as literals rather than env
 * vars, because this file is built twice by two bundlers that expose environment
 * variables differently. See that module for the full explanation.
 */

export default defineConfig([
  {
    name: "content",
    title: "Konten",
    basePath: "/studio/content",
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    plugins: [structureTool(), visionTool()],
    schema: { types: contentSchemaTypes },
  },
  {
    name: "submissions",
    title: "Antrean Demo",
    basePath: "/studio/submissions",
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_SUBMISSIONS_DATASET,
    plugins: [structureTool(), visionTool()],
    schema: { types: submissionSchemaTypes },
  },
]);
