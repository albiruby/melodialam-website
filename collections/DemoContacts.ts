import type { CollectionConfig } from 'payload';

/**
 * Manager contacts, one row per submission. Kept in its own collection so the
 * public demo queue cannot leak a phone number or email by accident: nothing in
 * the public read path touches this collection, because no public read path
 * exists at all. Every operation requires a signed-in curator.
 *
 * Rows are created server-side by `POST /api/demos` (with `overrideAccess`)
 * alongside the submission row, never by the browser directly.
 */
export const DemoContacts: CollectionConfig = {
  slug: 'demo-contacts',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['submission', 'createdAt'],
    group: 'Kurasi',
    description: 'Data pribadi — hanya kurator. Tidak pernah tampil publik.',
  },
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'submission',
      type: 'relationship',
      relationTo: 'demo-submissions',
      required: true,
      unique: true,
    },
    {
      name: 'contact',
      type: 'text',
      required: true,
      maxLength: 160,
    },
  ],
  timestamps: true,
};
