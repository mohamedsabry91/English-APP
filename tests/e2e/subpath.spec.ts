import { expect, test } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AddressInfo } from 'node:net';

// GitHub Pages serves the app under /English-APP/, not at the site root. The build uses relative
// paths (base './'), so the same dist must work there. This server serves dist ONLY under that
// prefix: anything the app asks for outside it is a 404 and fails the test.

const PREFIX = '/English-APP/';
const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'dist');
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function serveUnderPrefix(outside: string[]): Promise<{ server: Server; url: string }> {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');
    if (!path.startsWith(PREFIX)) {
      outside.push(path);
      res.writeHead(404).end();
      return;
    }
    const rest = path.slice(PREFIX.length);
    const file = normalize(join(DIST, rest === '' || rest.endsWith('/') ? rest + 'index.html' : rest));
    if (!file.startsWith(DIST) || !existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(await readFile(file));
  });
  return new Promise((resolve) => {
    server.listen(0, 'localhost', () => resolve({ server, url: `http://localhost:${(server.address() as AddressInfo).port}${PREFIX}` }));
  });
}

function close(server: Server): Promise<void> {
  server.closeAllConnections();
  return new Promise((resolve) => server.close(() => resolve()));
}

test.use({ serviceWorkers: 'allow' });

test('works under the GitHub Pages subpath /English-APP/, including the manifest, service worker and offline reload', async ({ page }) => {
  expect(existsSync(join(DIST, 'index.html')), 'run the build first (the webServer does this)').toBe(true);
  const outside: string[] = [];
  const failed: string[] = [];
  page.on('response', (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
  });
  const { server, url } = await serveUnderPrefix(outside);
  let closed = false;
  try {
    await page.goto(url);
    await expect(page.getByTestId('lang-en')).toBeVisible();

    // The manifest's start_url and scope resolve to the subpath.
    const manifest = await page.evaluate(async () => {
      const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
      if (!link) return null;
      const m = (await (await fetch(link.href)).json()) as { start_url: string; scope: string };
      return { start: new URL(m.start_url, link.href).pathname, scope: new URL(m.scope, link.href).pathname };
    });
    expect(manifest).toEqual({ start: PREFIX, scope: PREFIX });

    // The service worker is registered for the subpath only.
    const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
    expect(new URL(scope).pathname).toBe(PREFIX);

    await page.getByTestId('lang-en').click();
    await page.getByTestId('welcome-continue').click();
    await expect(page.getByTestId('placement-start')).toBeVisible();
    expect(outside, 'requests outside the subpath').toEqual([]);
    expect(failed, 'failed requests').toEqual([]);

    // Offline: the server goes away, and the app still loads from the service worker cache.
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await close(server);
    closed = true;
    await page.reload();
    await expect(page.getByTestId('placement-start')).toBeVisible();
  } finally {
    if (!closed) await close(server);
  }
});
