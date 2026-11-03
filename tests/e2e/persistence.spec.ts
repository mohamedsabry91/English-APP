import { expect, test } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { placementAllFirst, stored, storedRaw, welcome, STORAGE_KEY, loadApp } from './helpers';

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

test('an existing English learner (version 2 record) sees no change, and the next save keeps everything, per course', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-03T09:00:00+03:00') });
  await page.goto('./');
  const v2 = {
    version: 2,
    uiLang: 'en',
    onboarded: true,
    track: 'both',
    placement: { result: 'A2', date: '2026-11-01', correctByLevel: [8, 6, 2, 0], mistakeTags: ['ARTICLE'] },
    placementInProgress: null,
    completedLessons: ['g-a2-01'],
    completedWriting: [],
    cards: { 'ph-01': { id: 'ph-01', tags: [], box: 2, due: '2026-11-06', lastAnswered: '2026-11-02', mistakes: 0, learned: false, created: '2026-11-01' } },
    mistakeLog: [{ date: '2026-11-01', tag: 'ARTICLE', source: 'placement', count: 1 }],
    session: null,
    writingDraft: null,
    lastExport: null,
    createdOn: '2026-11-01',
    plan: { planId: '15-day-start', startedOn: '2026-11-01', completedDays: [{ day: 1, date: '2026-11-01' }, { day: 2, date: '2026-11-02' }], ratings: [{ day: 1, rating: 2 }], selfCheckStart: [1, 1, 2, 1, 1], selfCheckEnd: null, current: null, finishedOn: null },
  };
  await page.evaluate(([k, v]) => localStorage.setItem(k as string, v as string), [STORAGE_KEY, JSON.stringify(v2)]);
  await loadApp(page, 'today');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByTestId('plan-card-line')).toContainText('Day 3 of 15');
  await page.getByTestId('nav-settings').click();
  await expect(page.getByTestId('track-both')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Current result: A2')).toBeVisible();

  // Any change saves the record; it is now stored per course, with everything kept.
  await page.getByTestId('settings-lang-ar').click();
  await page.getByTestId('settings-lang-en').click();
  const raw = await storedRaw(page);
  expect(raw).toMatchObject({ version: 3, activeCourse: 'en-from-ar', uiLang: 'en', onboarded: true, createdOn: '2026-11-01' });
  const course = (raw?.courses as Record<string, Record<string, unknown>>)['en-from-ar'];
  const { version: _v, uiLang: _u, onboarded: _o, lastExport: _l, createdOn: _c, ...perCourse } = v2;
  void [_v, _u, _o, _l, _c];
  expect(course).toEqual(perCourse);
  await page.reload();
  await expect(page.getByTestId('track-both')).toHaveAttribute('aria-pressed', 'true');
});
