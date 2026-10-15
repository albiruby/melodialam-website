import type { CollectionConfig } from 'payload';

/**
 * Uploaded files: article covers and demo audio. Files land in Supabase Storage
 * (via the S3-compatible adapter configured in `payload.config.ts`); without
 * the S3 variables Payload falls back to local disk, which is fine for
 * development but never for production.
 *
 * The 25 MB audio cap (BR-001) is enforced in `POST /api/demos`, not here —
 * this collection accepts what the validated write path gives it.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Konten',
  },
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  upload: {
    mimeTypes: [
      'image/*',
      'audio/mpeg',
      'audio/wav',
      'audio/x-wav',
      'audio/ogg',
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
};
