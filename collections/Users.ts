import type { CollectionConfig } from 'payload';

/**
 * Curators. Payload's auth collection: email + password, sessions, and the
 * admin panel login. Every `req.user` check in the other collections refers
 * to a user from this collection.
 *
 * Seeded manually for now: create the first curator from the Payload admin
 * UI (`/admin`) once the database is connected.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: 'Akses',
  },
  access: {
    // Only a signed-in curator may list or manage accounts.
    read: ({ req }) => !!req.user,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'curator',
      options: [
        { label: 'Kurator', value: 'curator' },
        { label: 'Admin', value: 'admin' },
      ],
    },
  ],
};
