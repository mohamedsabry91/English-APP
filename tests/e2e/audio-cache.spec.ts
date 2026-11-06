import { expect, test } from '@playwright/test';
import { openApp } from './helpers';

// Clips are saved for offline use only through "Download for offline". Playing a clip (or any other
// request for one) must never store it. The clip bytes are generated here; no audio is in the repository.
test.use({ serviceWorkers: 'allow' });

const fakeClip = () => {
  const b = Buffer.alloc(64);
  b.write('OggS', 0);
  b.write('OpusHead', 28);
  return b;
};

test('the service worker reads downloaded clips from the cache, but never stores a clip itself', async ({ page, context, browserName }) => {
  // Requests made by a service worker can be routed by Playwright in Chromium only.
  test.skip(browserName !== 'chromium', 'Routing service worker requests is supported in Chromium only; the target platform is Android (Chrome).');
  const hits: string[] = [];
  // A server without Range support: always a full 200 response. One clip fails with 500.
  await context.route('**/audio/en-from-ar/review-test-*.opus', async (route) => {
    const url = new URL(route.request().url());
    hits.push(url.pathname.split('/').pop() ?? '');
    if (url.pathname.endsWith('review-test-bad.opus')) return route.fulfill({ status: 500, body: 'error' });
    return route.fulfill({ status: 200, contentType: 'audio/ogg', body: fakeClip() });
  });
  await openApp(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  const keys = () => page.evaluate(async () => (await (await caches.open('english-practice-audio')).keys()).map((r) => new URL(r.url).pathname.split('/').pop()).sort());

  // Listening (a plain or a range request through the service worker) does not store the clip.
  const played = await page.evaluate(async () => {
    const a = await fetch('audio/en-from-ar/review-test-a.opus');
    const b = await fetch('audio/en-from-ar/review-test-a.opus', { headers: { Range: 'bytes=0-9' } });
    return [a.status, b.status];
  });
  expect(played[0]).toBe(200);
  expect(await keys()).toEqual([]);

  // A failed download (one clip returns 500) leaves nothing half-stored.
  const failed = await page.evaluate(async () => {
    try {
      await (await caches.open('english-practice-audio')).addAll(['audio/en-from-ar/review-test-c.opus', 'audio/en-from-ar/review-test-bad.opus']);
      return 'stored';
    } catch {
      return 'failed';
    }
  });
  expect(failed).toBe('failed');
  expect(await keys()).toEqual([]);

  // Download stores the clips; after that they are served from the cache, also for range requests.
  await page.evaluate(async () => {
    await (await caches.open('english-practice-audio')).addAll(['audio/en-from-ar/review-test-a.opus', 'audio/en-from-ar/review-test-b.opus']);
  });
  expect(await keys()).toEqual(['review-test-a.opus', 'review-test-b.opus']);
  const before = hits.length;
  const fromCache = await page.evaluate(async () => {
    const full = await fetch('audio/en-from-ar/review-test-a.opus');
    const part = await fetch('audio/en-from-ar/review-test-b.opus', { headers: { Range: 'bytes=0-3' } });
    return { full: full.status, part: part.status, partText: await part.text() };
  });
  expect(fromCache).toEqual({ full: 200, part: 206, partText: 'OggS' });
  expect(hits.length).toBe(before);
});
