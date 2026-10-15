import { revalidateTag } from 'next/cache';
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig } from 'payload';

/** Kept in sync with `ARTICLES_TAG` in lib/articles.ts. */
const ARTICLES_TAG = 'articles';

/**
 * Public article reads are cached under one tag (see lib/articles.ts). Bumping
 * that tag here is what makes publishing in `/admin` show up on the site right
 * away instead of after the cache window lapses.
 *
 * Next 16 requires the second argument. `"max"` is the documented choice for
 * content like this: the next visitor is served the stale copy while the fresh
 * one loads behind them, so nobody waits on the revalidation.
 */
const revalidateArticles: CollectionAfterChangeHook = ({ doc }) => {
  revalidateTag(ARTICLES_TAG, 'max');
  return doc;
};

const revalidateAfterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  revalidateTag(ARTICLES_TAG, 'max');
  return doc;
};

/**
 * Editorial articles. This is the future home of what `lib/content.ts` holds
 * today; until the per-page migration is done that file stays the source of
 * truth for the public site (ARCH-RISK-005) and this collection is where new
 * articles are written.
 *
 * `slug` mirrors the `/journal/[slug]` route, so it must stay unique and
 * URL-safe. `image` points at the Media collection (Supabase Storage) rather
 * than holding a remote URL, which is what finally retires the placeholder set.
 */
export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'date', 'featured'],
    group: 'Konten',
  },
  versions: {
    drafts: {
      autosave: true,
    },
  },
  hooks: {
    afterChange: [revalidateArticles],
    afterDelete: [revalidateAfterDelete],
  },
  access: {
    // Published articles are public. Drafts are only visible to curators.
    read: ({ req }) => {
      if (req.user) return true;
      return {
        _status: {
          equals: 'published',
        },
      };
    },
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Samakan dengan segmen URL /journal/[slug], contoh: judul-artikel-baru.',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Fakta Musik', value: 'Fakta Musik' },
        { label: 'Rekomendasi Melodi', value: 'Rekomendasi Melodi' },
        { label: 'Bicara Melodi', value: 'Bicara Melodi' },
        { label: 'Liputan Panggung', value: 'Liputan Panggung' },
      ],
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
    },
    {
      name: 'author',
      type: 'text',
      defaultValue: 'Tim Redaksi Melodi Alam',
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Satu artikel featured menjadi hero di halaman utama.',
      },
    },
  ],
  timestamps: true,
};
