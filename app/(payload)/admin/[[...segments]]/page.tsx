import config from '@payload-config';
import { connection } from 'next/server';
import { RootPage, generatePageMetadata } from '@payloadcms/next/views';
import { importMap } from '../importMap.js';

type Args = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] }>;
};

/**
 * Admin panel. Matches Payload's generated template except for the two
 * additions below, which are both required by `cacheComponents`:
 *
 * 1. `instant = false` — the panel reads the URL and the session on every load,
 *    so it opts out of instant-navigation and static-shell validation.
 * 2. `await connection()` — Payload reads the current time while building its
 *    chrome, and Next refuses to prerender that: without this, rendering
 *    /admin fails with "encountered the unstable value `new Date()` while
 *    prerendering". The layout awaits it too, but the error surfaces from this
 *    component, so it belongs here as well.
 *
 * `dynamic = 'force-dynamic'` cannot be used — it is rejected under
 * `cacheComponents`. Keep the call shape of `RootPage` / `generatePageMetadata`
 * exactly as Payload ships it: both take `config` as a *promise* and resolve it
 * themselves, and awaiting it first throws
 * "Cannot destructure property 'config' as it is undefined".
 */
export const instant = false;

export const generateMetadata = ({ params, searchParams }: Args) =>
  generatePageMetadata({ config, params, searchParams });

const Page = async ({ params, searchParams }: Args) => {
  await connection();
  return RootPage({ config, params, searchParams, importMap });
};

export default Page;
