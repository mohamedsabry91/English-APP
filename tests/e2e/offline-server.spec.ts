import { expect, test } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AddressInfo } from 'node:net';

// A real loss of the network: the app is served by a small server that this test owns, and the
// test shuts it down. Unlike context.setOffline(), this does not depend on each browser's network
// emulation, so it checks the service worker the same way in Chromium and WebKit.

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

function serveDist(): Promise<{ server: Server; url: string }> {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');
    const file = normalize(join(DIST, path.endsWith('/') ? path + 'index.html' : path));
    if (!file.startsWith(DIST) || !existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(await readFile(file));
  });
  return new Promise((resolve) => {
    server.listen(0, 'localhost', () => resolve({ server, url: `http://localhost:${(server.address() as AddressInfo).port}/` }));
  });
}

function close(server: Server): Promise<void> {
  server.closeAllConnections();
  return new Promise((resolve) => server.close(() => resolve()));
}

test.use({ serviceWorkers: 'allow' });

test('works after the server is gone: reload and use the app from the service worker cache', async ({ page }) => {
  expect(existsSync(join(DIST, 'index.html')), 'run the build first (the webServer does this)').toBe(true);
  const { server, url } = await serveDist();
  try {
    await page.goto(url);
    await expect(page.getByTestId('lang-en')).toBeVisible();
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await page.getByTestId('lang-en').click();
    await page.getByTestId('welcome-continue').click();
    await expect(page.getByTestId('placement-start')).toBeVisible();
  } finally {
    await close(server);
  }

  // The server is closed: nothing can be loaded from the network any more.
  const direct = await page.request.get(url).then(
    () => 'reachable',
    () => 'unreachable',
  );
  expect(direct).toBe('unreachable');

  await page.reload();
  await expect(page.getByTestId('placement-start')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await page.getByTestId('placement-start').click();
  await expect(page.getByTestId('placement-question')).toBeVisible();
});
