import type { CollectionConfig } from 'payload';

/**
 * Spaces & instruments showcase. Mirrors the `SpaceItem` shape in
 * `lib/content.ts` so the `/spaces` page can migrate to it per page later.
 * Fully public: everything here is catalogue copy, nothing personal.
 */
export const EcosystemItems: CollectionConfig = {
  slug: 'ecosystem-items',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'categoryLabel', 'cardHeightVariant'],
    group: 'Konten',
  },
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'categoryLabel',
      type: 'select',
      required: true,
      options: [
        { label: 'Space', value: 'SPACE' },
        { label: 'Instrument', value: 'INSTRUMENT' },
        { label: 'Live event', value: 'LIVE EVENT' },
        { label: 'Hospitality', value: 'HOSPITALITY' },
      ],
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'subtitle',
      type: 'textarea',
    },
    {
      name: 'priceOrInfo',
      type: 'text',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'ctaUrl',
      type: 'text',
    },
    {
      name: 'cardHeightVariant',
      type: 'select',
      defaultValue: 'compact',
      options: [
        { label: 'Tall', value: 'tall' },
        { label: 'Compact', value: 'compact' },
      ],
    },
  ],
  timestamps: true,
};
