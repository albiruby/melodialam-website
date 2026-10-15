import { defineField, defineType } from "sanity";
import {
  asOptions,
  DEMO_GENRES,
  DEMO_INITIAL_STATUS,
  DEMO_PROGRAMS,
  DEMO_STATUSES,
} from "../../lib/taxonomy";

/**
 * A musician's demo submission. Lives in the PRIVATE `submissions` dataset
 * alongside its contact record — see demoContact.ts.
 *
 * Only rows a curator has approved are ever shown in the public queue
 * (ADR-0005). The site never reads this dataset without the server token.
 */
export const demoSubmission = defineType({
  name: "demoSubmission",
  title: "Kiriman Demo",
  type: "document",
  fields: [
    defineField({
      name: "artist",
      title: "Band / solois",
      type: "string",
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: "city",
      title: "Kota asal",
      type: "string",
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: "title",
      title: "Judul lagu / EP",
      type: "string",
      validation: (rule) => rule.required().max(160),
    }),
    defineField({
      name: "genre",
      title: "Genre",
      type: "string",
      options: { list: asOptions(DEMO_GENRES) },
    }),
    defineField({
      name: "program",
      title: "Program tujuan",
      type: "string",
      options: { list: asOptions(DEMO_PROGRAMS) },
    }),
    defineField({
      name: "link",
      title: "Link streaming / EPK",
      type: "url",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "story",
      title: "Cerita singkat",
      type: "text",
      rows: 5,
      validation: (rule) => rule.required().max(2000),
    }),
    defineField({
      name: "status",
      title: "Status moderasi",
      description: "BR-002: kiriman publik selalu mulai IN REVIEW; hanya kurator yang mengubahnya.",
      type: "string",
      options: {
        list: [
          { title: "In review", value: "IN REVIEW" },
          { title: "Shortlisted (Samsara)", value: "SHORTLISTED (SAMSARA)" },
          { title: "Approved (article)", value: "APPROVED (ARTICLE)" },
          { title: "Archived", value: "ARCHIVED" },
        ],
        layout: "radio",
      },
      initialValue: DEMO_INITIAL_STATUS,
      validation: (rule) =>
        rule.required().custom((value) =>
          typeof value === "string" && !(DEMO_STATUSES as readonly string[]).includes(value)
            ? "Status tidak dikenal."
            : true,
        ),
    }),
    defineField({
      name: "submittedAt",
      title: "Dikirim pada",
      type: "date",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "audioName",
      title: "Nama berkas audio",
      type: "string",
      readOnly: true,
      description: "Metadata saja (BR-001) — berkasnya tidak disimpan di sini.",
    }),
  ],
  orderings: [
    { title: "Terbaru", name: "submittedDesc", by: [{ field: "submittedAt", direction: "desc" }] },
  ],
  preview: {
    select: { title: "title", subtitle: "artist", status: "status" },
    prepare: ({ title, subtitle, status }) => ({
      title: `${title ?? "(tanpa judul)"} — ${subtitle ?? ""}`,
      subtitle:
        status === "SHORTLISTED (SAMSARA)" || status === "APPROVED (ARTICLE)"
          ? `✅ ${status}`
          : status === "ARCHIVED"
            ? "📦 Diarsipkan"
            : "🕓 Ditinjau",
    }),
  },
});
