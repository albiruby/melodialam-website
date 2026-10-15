"use client";

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { contentSchemaTypes, submissionSchemaTypes } from "./sanity/schemaTypes";

/**
 * Two workspaces, one Studio.
 *
 * The split is not cosmetic: `production` is a public dataset, so its reads need
 * no token and can sit behind the CDN, while `submissions` is private and holds
 * musician contact details. A single workspace cannot span both.
 *
 * `basePath` is required per workspace once there is more than one; the embedded
 * Studio at app/studio/[[...tool]] serves /studio/content and /studio/submissions.
 */

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const submissionsDataset = process.env.NEXT_PUBLIC_SANITY_SUBMISSIONS_DATASET;

if (!projectId || !dataset || !submissionsDataset) {
  throw new Error(
    "Sanity env vars missing. Set NEXT_PUBLIC_SANITY_PROJECT_ID, " +
      "NEXT_PUBLIC_SANITY_DATASET and NEXT_PUBLIC_SANITY_SUBMISSIONS_DATASET.",
  );
}

export default defineConfig([
  {
    name: "content",
    title: "Konten",
    basePath: "/studio/content",
    projectId,
    dataset,
    plugins: [structureTool(), visionTool()],
    schema: { types: contentSchemaTypes },
  },
  {
    name: "submissions",
    title: "Antrean Demo",
    basePath: "/studio/submissions",
    projectId,
    dataset: submissionsDataset,
    plugins: [structureTool(), visionTool()],
    schema: { types: submissionSchemaTypes },
  },
]);
