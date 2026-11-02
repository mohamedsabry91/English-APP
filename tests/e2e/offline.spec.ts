import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'allow' });

test('works offline after the first load, including reload', async ({ page, context }) => {
  await page.goto('./');
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
