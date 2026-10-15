import config from '@payload-config';
import '@payloadcms/next/css';
import type { ServerFunctionClient } from 'payload';
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts';
import { connection } from 'next/server';
import React from 'react';

import { importMap } from './admin/importMap.js';
import './custom.scss';

type Args = {
  children: React.ReactNode;
};

/**
 * Root layout for the Payload segment.
 *
 * Two things here are load-bearing and were both learned the hard way:
 *
 * 1. This file must exist. Without it the admin panel nests inside the site's
 *    own `app/layout.tsx` (fonts, masthead, MotionRoot), producing two nested
 *    `<html>` elements and a hydration failure. The site lives in `app/(site)`
 *    so each group has its own root layout.
 *
 * 2. `await connection()` marks the segment dynamic before Payload renders.
 *    Payload reads the current time while building its chrome, and under
 *    `cacheComponents` Next refuses to prerender that: without this it fails
 *    with "encountered the unstable value `new Date()` while prerendering".
 *    `dynamic = 'force-dynamic'` is not usable — it is rejected under
 *    `cacheComponents`.
 */
const serverFunction: ServerFunctionClient = async function (args) {
  'use server';
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

const Layout = async ({ children }: Args) => {
  await connection();

  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  );
};

export default Layout;
