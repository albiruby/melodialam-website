import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';

import { Users } from './collections/Users.ts';
import { Articles } from './collections/Articles.ts';
import { DemoSubmissions } from './collections/DemoSubmissions.ts';
import { DemoContacts } from './collections/DemoContacts.ts';
import { EcosystemItems } from './collections/EcosystemItems.ts';
import { Media } from './collections/Media.ts';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

/**
 * Supabase Storage speaks S3, so the S3 adapter points at it. All five
 * variables must be present or the plugin stays off and uploads fall back to
 * local disk — the right default for a checkout with no credentials, and never
 * the production setup. See `.env.example`.
 *
 * Tooling note: every `payload *` npm script runs with `--disable-transpile`
 * because the tsx loader hook crashes on Node 24 (`ERR_REQUIRE_ASYNC_MODULE`
 * from `@payloadcms/richtext-lexical`). With the flag, Node loads the config
 * directly with type-stripping — which is why the relative imports above carry
 * explicit `.ts` extensions, together with `allowImportingTsExtensions` in
 * tsconfig.json. Do not "clean up" either without re-running
 * `npm run generate:importmap` first.
 */
const hasS3 = Boolean(
  process.env.S3_BUCKET &&
    process.env.S3_ENDPOINT &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY &&
    process.env.S3_REGION,
);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      title: 'Melodi Alam CMS',
    },
    /*
     * Next's dev runtime injects a FOUC-prevention <style> into <head> after the
     * HTML arrives and before React hydrates, which shifts the <style> React is
     * comparing against Payload's own and produces a hydration mismatch on the
     * admin's <html>. The server HTML itself contains only Payload's style —
     * verified — so this is a dev-runtime artefact, not a rendering bug. Payload
     * exposes this flag for exactly that: it puts suppressHydrationWarning on the
     * admin's <html>, which is the documented escape hatch for markup a third
     * party touches before hydration. Production is unaffected either way.
     */
    suppressHydrationWarning: true,
  },
  collections: [Users, Articles, DemoSubmissions, DemoContacts, EcosystemItems, Media],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'dev-only-secret-change-me-before-production',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      // No DATABASE_URL (fresh checkout, CI without secrets): the pool is
      // created but never connected until something queries it, and the public
      // site never queries it — it reads lib/content.ts until migration. The
      // admin panel and /api/demos will fail loudly instead of half-working.
      connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/melodi_alam',
    },
    idType: 'uuid',
  }),
  plugins: hasS3
    ? [
        s3Storage({
          collections: {
            media: true,
          },
          bucket: process.env.S3_BUCKET as string,
          config: {
            endpoint: process.env.S3_ENDPOINT as string,
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
            },
            region: process.env.S3_REGION as string,
            forcePathStyle: true,
          },
        }),
      ]
    : [],
});
