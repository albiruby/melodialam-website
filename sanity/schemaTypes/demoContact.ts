import { defineField, defineType } from "sanity";

/**
 * The manager contact behind a submission.
 *
 * Kept as its own document rather than a field on the submission so the contact
 * never travels with the row the public queue reads. It lives in the PRIVATE
 * `submissions` dataset; nothing outside the server token can read it.
 */
export const demoContact = defineType({
  name: "demoContact",
  title: "Kontak Demo",
  type: "document",
  fields: [
    defineField({
      name: "submission",
      title: "Kiriman",
      type: "reference",
      to: [{ type: "demoSubmission" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "contact",
      title: "Kontak manajer",
      type: "string",
      description: "Nomor WhatsApp atau email. Tidak pernah tampil di situs.",
      validation: (rule) => rule.required().max(160),
    }),
  ],
  preview: {
    select: { title: "contact", subtitle: "submission.artist" },
  },
});
