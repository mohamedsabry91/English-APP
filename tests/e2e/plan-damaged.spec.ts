import { expect, test } from '@playwright/test';
import { STORAGE_KEY, stored, loadApp } from './helpers';

// A progress record whose plan points to a day that does not exist (for example, from a damaged import).
const damaged = {
  version: 2,
  uiLang: 'en',
  onboarded: true,
  placement: { result: 'START_A1', date: '2026-11-01', correctByLevel: [], mistakeTags: [] },
  completedLessons: ['g-a1-01'],
  plan: { planId: '15-day-start', startedOn: '2026-11-01', completedDays: [{ day: 1, date: '2026-11-01' }], ratings: [], selfCheckStart: null, selfCheckEnd: null, current: { day: 99, step: 3 }, finishedOn: null },
};

test('a plan pointing to a day that does not exist does not crash the app', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-04T09:00:00+03:00') });
  await page.goto('./');
  await page.evaluate(([k, v]) => localStorage.setItem(k as string, v as string), [STORAGE_KEY, JSON.stringify(damaged)]);
  await loadApp(page, 'today');
  await expect(page.getByTestId('plan-card-line')).toHaveText('Day 2 of 15');
  await loadApp(page, 'plan-day');
  await expect(page.getByTestId('error-screen')).toHaveCount(0);
  await expect(page.getByTestId('plan-day-title')).toHaveText('Day 2 of 15');
  // The rest of the progress is kept.
  const p = await stored(page);
  expect(p?.completedLessons).toEqual(['g-a1-01']);
});
