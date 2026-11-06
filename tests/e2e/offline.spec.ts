import { expect, test } from '@playwright/test';
import { openApp } from './helpers';

test.use({ serviceWorkers: 'allow' });

test('works offline after the first load, including reload', async ({ page, context, browserName }) => {
  // Skipped on WebKit only, by the owner's decision (PR 1). In Playwright's WebKit, the reload after
  // context.setOffline(true) always fails with "WebKit encountered an internal error", before the
  // service worker can answer. Offline use in WebKit is still tested by offline-server.spec.ts,
  // which shuts down a real server instead. The target platform is Android (Chrome), and this test
  // still runs there in Chromium.
  test.skip(
    browserName === 'webkit',
    'Playwright WebKit offline emulation breaks reload; offline on WebKit is covered by offline-server.spec.ts; target platform is Android (Chrome).',
  );
  await openApp(page);
  await expect(page.getByTestId('lang-en')).toBeVisible();
  // Wait until the service worker controls the page and has cached the app.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.getByTestId('lang-en').click();
  await page.getByTestId('welcome-continue').click();
  await expect(page.getByTestId('placement-start')).toBeVisible();

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('placement-start')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await page.getByTestId('placement-start').click();
  await expect(page.getByTestId('placement-question')).toBeVisible();
  await context.setOffline(false);
});
