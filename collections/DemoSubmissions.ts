import type { CollectionConfig } from 'payload';

/**
 * Demo submissions. Mirrors the `DemoSubmission` shape in `lib/content.ts`, but
 * `status` is a real enum (BR-002) instead of free text, and the manager
 * contact lives in the separate `demo-contacts` collection rather than on this
 * row — so no public read path can ever return it (ADR-0005).
 *
 * Access model (moderated queue):
 * - Anonymous readers see only rows a curator has approved. The statuses that
 *   count as approved are the two outcomes BR-002 names.
 * - Writes never come through the public API: `create` is closed and every
 *   submission goes through `POST /api/demos`, which validates, caps and
 *   truncates the fields, checks the audio metadata (BR-001), and then writes
 *   here with `overrideAccess`.
 * - Status changes are curator-only.
 */
export const DEMO_APPROVED_STATUSES = ['SHORTLISTED (SAMSARA)', 'APPROVED (ARTICLE)'] as const;

export const DemoSubmissions: CollectionConfig = {
  slug: 'demo-submissions',
  admin: {
    useAsTitle: 'artist',
    defaultColumns: ['artist', 'city', 'genre', 'program', 'status', 'createdAt'],
    group: 'Kurasi',
  },
  access: {
    read: ({ req }) => {
      if (req.user) return true;
      return {
        status: {
          in: [...DEMO_APPROVED_STATUSES],
        },
      };
    },
    create: () => false,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'artist',
      type: 'text',
      required: true,
      maxLength: 120,
    },
    {
      name: 'city',
      type: 'text',
      required: true,
      maxLength: 80,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 160,
    },
    {
      name: 'genre',
      type: 'select',
      options: [
        { label: 'Indie Pop / Folk', value: 'Indie Pop / Folk' },
        { label: 'Alternative Rock / Shoegaze', value: 'Alternative Rock / Shoegaze' },
        { label: 'Surf Rock / Punk', value: 'Surf Rock / Punk' },
        { label: 'R&B / Soul / Jazz', value: 'R&B / Soul / Jazz' },
        { label: 'Ska / Reggae / Dub', value: 'Ska / Reggae / Dub' },
        { label: 'Electronic / Experimental', value: 'Electronic / Experimental' },
      ],
    },
    {
      name: 'program',
      type: 'select',
      options: [
        { label: 'Review Artikel dan Rekomendasi IG', value: 'Review Artikel dan Rekomendasi IG' },
        { label: 'Live at Melodi Samsara', value: 'Live at Melodi Samsara' },
        { label: 'Tamu Podcast Bicara Melodi', value: 'Tamu Podcast Bicara Melodi' },
      ],
    },
    {
      name: 'link',
      type: 'text',
      required: true,
      maxLength: 500,
      validate: (value: unknown) => {
        if (typeof value !== 'string' || !/^https?:\/\/.+/i.test(value)) {
          return 'Link harus diawali http:// atau https://.';
        }
        return true;
      },
    },
    {
      name: 'story',
      type: 'textarea',
      required: true,
      maxLength: 2000,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'IN REVIEW',
      options: [
        { label: 'In review', value: 'IN REVIEW' },
        { label: 'Shortlisted (Samsara)', value: 'SHORTLISTED (SAMSARA)' },
        { label: 'Approved (article)', value: 'APPROVED (ARTICLE)' },
        { label: 'Archived', value: 'ARCHIVED' },
      ],
      admin: {
        description:
          'BR-002: kiriman publik selalu mulai IN REVIEW; hanya kurator yang mengubahnya.',
      },
    },
  ],
  timestamps: true,
};
