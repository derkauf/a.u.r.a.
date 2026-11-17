/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { existsSync, readFileSync } from 'node:fs';
import { iwsdkDev } from '@iwsdk/vite-plugin-dev';
import { defineConfig } from 'vite';

// LAN certificate from `npm run cert:lan` (covers this PC's Wi-Fi IP so a
// Quest/phone gets a bypassable warning). When absent, the IWSDK plugin
// generates its own localhost-only certificate as before.
const LAN_KEY = '.iwsdk/https-lan/key.pem';
const LAN_CERT = '.iwsdk/https-lan/cert.pem';
const lanHttps =
  existsSync(LAN_KEY) && existsSync(LAN_CERT)
    ? { key: readFileSync(LAN_KEY), cert: readFileSync(LAN_CERT) }
    : undefined;

export default defineConfig({
  plugins: [iwsdkDev()],
  server: {
    host: '0.0.0.0',
    port: 8081,
    open: false,
    ...(lanHttps ? { https: lanHttps } : {}),
    // docs/ is not part of the app. Watching it crashed the dev server with
    // EBUSY while large files were still being copied in (Windows lock).
    watch: { ignored: ['**/docs/**'] },
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    target: 'esnext',
    rollupOptions: { input: './index.html' },
  },
  esbuild: { target: 'esnext' },
  // @drawcall/uikitml otherwise pulls a second three/@pmndrs/uikit graph
  // (its own three vs the app's super-three alias). Duplicate Component classes break
  // instanceof checks → "Only pmndrs/uikit components can be added as children".
  resolve: {
    dedupe: [
      'three',
      '@pmndrs/uikit',
      '@pmndrs/uikit-horizon',
      '@pmndrs/uikit-lucide',
    ],
  },
  optimizeDeps: {
    exclude: ['@babylonjs/havok'],
    include: [
      'three',
      '@pmndrs/uikit',
      '@pmndrs/uikit-horizon',
      '@pmndrs/uikit-lucide',
      '@drawcall/uikitml',
      // CommonJS (uses top-level `this`); pre-bundled for the browser.
      'js-aruco2',
    ],
    esbuildOptions: { target: 'esnext' },
  },
  publicDir: 'public',
  base: './',
});
