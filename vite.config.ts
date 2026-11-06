import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Strict Content Security Policy. It is added to index.html at build time only,
// because the Vite dev server needs inline styles for hot reload.
export const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

const cspPlugin: Plugin = {
  name: 'inject-csp',
  apply: 'build',
  transformIndexHtml(html) {
    return html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`);
  },
};

export default defineConfig({
  base: './',
  plugins: [
    react(),
    cspPlugin,
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'English Practice',
        short_name: 'English Practice',
        description: 'Practise English for Arabic speakers. Works offline. Progress stays on this device.',
        lang: 'ar',
        dir: 'rtl',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#f7f6f2',
        theme_color: '#1f5f5b',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        // Speech clips are not precached. They are saved for offline use only by "Download for offline"
        // (src/audio/offline.ts), in this cache. This route reads that cache first and otherwise goes to
        // the network WITHOUT storing anything (cacheWillUpdate returns null), so listening never saves a
        // clip. Range requests are answered from the full cached file.
        runtimeCaching: [
          {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && /\/audio\/[a-z]{2,3}-from-[a-z]{2,3}\/[a-z0-9][a-z0-9-]*\.opus$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'english-practice-audio',
              rangeRequests: true,
              plugins: [{ cacheWillUpdate: async () => null }],
            },
          },
        ],
      },
    }),
  ],
  build: { outDir: 'dist', sourcemap: false },
});
