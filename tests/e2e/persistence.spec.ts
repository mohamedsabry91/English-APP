import { expect, test } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { placementAllFirst, stored, welcome, STORAGE_KEY } from './helpers';

test('reload keeps progress; export then delete then import restores it', async ({ page }, info) => {
  await welcome(page, 'en');
  await placementAllFirst(page);
  await page.getByTestId('result-continue').click();
  await page.getByTestId('nav-settings').click();
  await page.getByTestId('track-both').click();

  await page.reload();
  await expect(page.getByTestId('track-both')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Current result: Starting A1')).toBeVisible();
  const before = await stored(page);
  expect(before?.placement).toBeTruthy();

  // Export
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('export').click();
  const download = await downloadPromise;
  const file = info.outputPath('progress.json');
  await download.saveAs(file);
  const exported = JSON.parse(readFileSync(file, 'utf8'));
  expect(exported.kind).toBe('english-practice-progress');

  // Delete all, with confirmation
  await page.getByTestId('delete-all').click();
  await page.getByTestId('confirm-no').click();
  expect(await stored(page)).not.toBeNull();
  await page.getByTestId('delete-all').click();
  await page.getByTestId('confirm-yes').click();
  await expect(page.getByTestId('welcome-continue')).toBeVisible();
  expect(await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY)).toBeNull();
  await page.reload();
  await expect(page.getByTestId('welcome-continue')).toBeVisible();

  // Import restores it
  await page.getByTestId('lang-en').click();
  await page.getByTestId('welcome-continue').click();
  await page.goto('./#/settings');
  await page.getByTestId('import-file').setInputFiles(file);
  await page.getByTestId('confirm-yes').click();
  await expect(page.getByTestId('settings-notice')).toHaveText('Progress loaded.');
  await expect(page.getByText('Current result: Starting A1')).toBeVisible();
  await expect(page.getByTestId('track-both')).toHaveAttribute('aria-pressed', 'true');
  const after = await stored(page);
  expect(after?.placement).toEqual(before?.placement);
  expect(after?.mistakeLog).toEqual(before?.mistakeLog);
});

test('import rejects a file that is not a progress file', async ({ page }, info) => {
  await welcome(page, 'en');
  await page.getByTestId('placement-skip').click();
  await page.goto('./#/settings');
  const bad = info.outputPath('bad.json');
  writeFileSync(bad, '{"hello": 1}');
  await page.getByTestId('import-file').setInputFiles(bad);
  await expect(page.getByTestId('settings-notice')).toHaveText('This is not a progress file from this app.');
});

test('the app still runs when storage is blocked, and says so', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('SecurityError');
      },
    });
  });
  await page.goto('./');
  await expect(page.getByTestId('storage-banner')).toBeVisible();
  await page.getByTestId('lang-en').click();
  await page.getByTestId('welcome-continue').click();
  await expect(page.getByTestId('placement-start')).toBeVisible();
});

test('import rejects a file over the limits with a clear message and keeps current progress', async ({ page }, info) => {
  await welcome(page, 'en');
  await page.getByTestId('placement-skip').click();
  await page.goto('./#/settings');
  const before = await stored(page);
  const file = info.outputPath('too-many.json');
  const completedLessons = Array.from({ length: 1001 }, (_, i) => `l${i}`);
  writeFileSync(file, JSON.stringify({ kind: 'english-practice-progress', exportedOn: '2026-11-02', progress: { version: 1, onboarded: true, completedLessons } }));
  await page.getByTestId('import-file').setInputFiles(file);
  await expect(page.getByTestId('settings-notice')).toHaveText(
    'This file has more data than a progress file from this app can have, so it was not loaded. Your current progress has not changed.',
  );
  expect(await stored(page)).toEqual(before);
});

test('import says so when the plan data in the file is damaged, and loads the rest', async ({ page }, info) => {
  await welcome(page, 'en');
  await page.getByTestId('placement-skip').click();
  await page.goto('./#/settings');
  const file = info.outputPath('bad-plan.json');
  writeFileSync(
    file,
    JSON.stringify({ kind: 'english-practice-progress', exportedOn: '2026-11-03', progress: { version: 2, onboarded: true, completedLessons: ['g-a1-01'], plan: { planId: '15-day-start', startedOn: 'yesterday' } } }),
  );
  await page.getByTestId('import-file').setInputFiles(file);
  await page.getByTestId('confirm-yes').click();
  await expect(page.getByTestId('settings-notice')).toHaveText('Progress loaded. The plan data in this file was damaged, so it was not loaded. Your other progress was loaded.');
  const p = await stored(page);
  expect(p?.plan).toBeNull();
  expect(p?.completedLessons).toEqual(['g-a1-01']);
});
