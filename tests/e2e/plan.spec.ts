import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { answer, expectNoOverflow, stored, welcome, STORAGE_KEY, loadApp, openApp } from './helpers';

const SHOTS = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs', 'screenshots');

async function checkScreen(page: Page, label: string, shot: string | null) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoOverflow(page, label);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const bad = axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(bad.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`), label).toEqual([]);
  if (shot) await page.screenshot({ path: join(SHOTS, `${shot}.png`), fullPage: true });
}

/** Go through the plan day on screen until it is finished. */
async function doPlanDay(page: Page, opts: { rating: 1 | 2 | 3; knew: boolean }) {
  for (let i = 0; i < 80; i++) {
    if (await page.getByTestId('plan-done-today').isVisible()) return;
    if (await page.getByTestId('plan-finished').isVisible()) return;
    if (await page.getByTestId('plan-start-day').isVisible()) {
      await page.getByTestId('plan-start-day').click();
      continue;
    }
    const step = await page.getByTestId('plan-step-body').getAttribute('data-step');
    if (step === 'selfCheckStart' || step === 'selfCheckEnd') {
      for (let s = 0; s < 5; s++) await page.getByTestId(`self-check-${s}-1`).click();
      await page.getByTestId('self-check-save').click();
    } else if (step === 'say') {
      await expect(page.getByTestId('say-note')).toBeVisible();
      await page.getByTestId('show-sample').click();
      await page.getByTestId(`say-rate-${opts.rating}`).click();
    } else if (step === 'mistakes') {
      await page.getByTestId('plan-finish-day').click();
    } else if (step === 'message') {
      await page.getByTestId('plan-skip-message').click();
    } else if (await page.getByTestId('recall-show').isVisible()) {
      await page.getByTestId('recall-show').click();
      await page.getByTestId(opts.knew ? 'recall-knew' : 'recall-not-yet').click();
      await page.getByTestId('next').click();
    } else if (await page.getByTestId('check').isVisible()) {
      await answer(page, true);
      await page.getByTestId('next').click();
    } else if (await page.getByTestId('show-sample').isVisible()) {
      await page.getByTestId('show-sample').click();
    } else {
      await page.getByTestId('plan-next').click();
    }
  }
  throw new Error('plan day did not finish');
}

for (const lang of ['ar', 'en'] as const) {
  test(`15-Day Start: picker, day 1, phrase review on day 2, and what you did (${lang})`, async ({ page }, info) => {
    const shot = info.project.name === 'chromium';
    const hosts = new Set<string>();
    page.on('request', (r) => hosts.add(new URL(r.url()).host));
    await page.clock.install({ time: new Date('2026-11-04T09:00:00+03:00') });
    await welcome(page, lang);
    await page.getByTestId('placement-skip').click();

    // Today -> picker
    await page.getByTestId('plan-see').click();
    const honest = page.getByTestId('plan-honest');
    await expect(honest).toContainText('أقل من مستوى A1');
    await expect(honest).toContainText('It will not make you fluent');
    // Arabic first, in both languages.
    const order = await honest.locator('p').evaluateAll((ps) => ps.map((p) => p.getAttribute('lang')));
    expect(order).toEqual(['ar', 'en']);
    await expect(page.getByTestId('plan-routine').locator('li')).toHaveCount(5);
    await checkScreen(page, `${lang} plan picker`, shot ? `${lang}-20-plan-picker` : null);
    const pickerText = (await page.locator('main').innerText()).toLowerCase();
    expect(pickerText).not.toMatch(/learn (english )?in 15 days|fluent in|%/);
    await page.getByTestId('plan-start').click();

    // Day 1
    await expect(page.getByTestId('plan-day-title')).toBeVisible();
    await checkScreen(page, `${lang} plan day intro`, shot ? `${lang}-21-plan-day` : null);
    await page.getByTestId('plan-start-day').click();
    await expect(page.getByTestId('self-check-step')).toBeVisible();
    await checkScreen(page, `${lang} self-check`, null);
    await doPlanDay(page, { rating: 2, knew: true });
    let p = await stored(page);
    const plan = p?.plan as { completedDays: { day: number; date: string }[]; ratings: unknown[]; selfCheckStart: number[] };
    expect(plan.completedDays).toEqual([{ day: 1, date: '2026-11-04' }]);
    expect(plan.ratings).toEqual([{ day: 1, rating: 2 }]);
    expect(plan.selfCheckStart).toEqual([1, 1, 1, 1, 1]);
    const cards = p?.cards as Record<string, { box: number; due: string; mistakes: number }>;
    for (const id of ['ph-01', 'ph-02', 'ph-03', 'ph-04']) expect(cards[id], id).toMatchObject({ box: 1, due: '2026-11-05', mistakes: 0 });

    // Only one plan day per calendar day.
    await page.reload();
    await expect(page.getByTestId('plan-done-today')).toBeVisible();

    // Day 2: the phrases come back as review cards.
    await page.clock.setFixedTime(new Date('2026-11-05T09:00:00+03:00'));
    await loadApp(page, 'today');
    await page.getByTestId('plan-card-start').click();
    await page.getByTestId('plan-start-day').click();
    await expect(page.getByTestId('phrase-recall')).toBeVisible();
    await checkScreen(page, `${lang} phrase recall`, shot ? `${lang}-22-phrase-recall` : null);
    await doPlanDay(page, { rating: 3, knew: true });
    p = await stored(page);
    expect((p?.cards as Record<string, { box: number }>)['ph-01']?.box).toBe(2);

    // What you did
    await page.goto('./#/plan-progress');
    await expect(page.getByTestId('progress-days')).toContainText('2');
    await expect(page.getByTestId('progress-ratings').locator('li')).toHaveCount(2);
    await expect(page.getByTestId('goal-days')).toHaveAttribute('data-reached', 'no');
    await expect(page.getByTestId('progress-privacy')).toBeVisible();
    const text = await page.locator('main').innerText();
    expect(text).not.toMatch(/%|streak|score:/i);
    await checkScreen(page, `${lang} what you did`, shot ? `${lang}-23-plan-progress` : null);

    // The plan is in the exported file.
    const download = page.waitForEvent('download');
    await page.goto('./#/settings');
    await page.getByTestId('export').click();
    const file = info.outputPath('progress.json');
    await (await download).saveAs(file);
    const exported = JSON.parse(readFileSync(file, 'utf8'));
    expect(exported.progress.plan.completedDays).toHaveLength(2);
    expect([...hosts]).toEqual(['localhost:4173']);
  });
}

test('a review day has the goal message, and the end shows what you can and cannot do yet', async ({ page }, info) => {
  await page.clock.install({ time: new Date('2026-11-20T09:00:00+03:00') });
  await openApp(page);
  const days = (n: number) => Array.from({ length: n }, (_, i) => ({ day: i + 1, date: `2026-11-${String(i + 1).padStart(2, '0')}` }));
  const base = { version: 2, uiLang: 'en', onboarded: true, placement: { result: 'START_A1', date: '2026-11-01', correctByLevel: [], mistakeTags: [] } };
  await page.evaluate(([k, v]) => localStorage.setItem(k as string, v as string), [
    STORAGE_KEY,
    JSON.stringify({ ...base, plan: { planId: '15-day-start', startedOn: '2026-11-01', completedDays: days(5), ratings: [], selfCheckStart: [1, 1, 1, 1, 1], selfCheckEnd: null, current: { day: 6, step: 2 }, finishedOn: null } }),
  ]);
  await loadApp(page, 'plan-day');
  await expect(page.getByTestId('plan-step-body')).toHaveAttribute('data-step', 'message');
  await expect(page.getByTestId('writing-task')).toHaveAttribute('data-task-id', 'w-p15-request');
  await expectNoOverflow(page, 'review day message');

  await page.evaluate(([k, v]) => localStorage.setItem(k as string, v as string), [
    STORAGE_KEY,
    JSON.stringify({ ...base, plan: { planId: '15-day-start', startedOn: '2026-11-01', completedDays: days(15), ratings: [{ day: 15, rating: 2 }], selfCheckStart: [1, 1, 1, 1, 1], selfCheckEnd: [2, 3, 3, 2, 2], current: null, finishedOn: '2026-11-15' } }),
  ]);
  await loadApp(page, 'plan-progress');
  await expect(page.getByTestId('progress-end')).toContainText('You can now:');
  await expect(page.getByTestId('progress-end')).toContainText('You cannot yet:');
  await expect(page.getByTestId('goal-intro')).toHaveAttribute('data-reached', 'yes');
  await expect(page.getByTestId('goal-days')).toHaveAttribute('data-reached', 'yes');
  await expect(page.getByTestId('progress-self-check')).toContainText('A little');
  if (info.project.name === 'chromium') await page.screenshot({ path: join(SHOTS, 'en-24-plan-end.png'), fullPage: true });
  await expectNoOverflow(page, 'plan end');
});

test('day 15: the real last day finishes the plan, and the end screen shows what you can and cannot do yet', async ({ page }, info) => {
  await page.clock.install({ time: new Date('2026-11-15T09:00:00+03:00') });
  await openApp(page);
  const days = Array.from({ length: 14 }, (_, i) => ({ day: i + 1, date: `2026-11-${String(i + 1).padStart(2, '0')}` }));
  await page.evaluate(([k, v]) => localStorage.setItem(k as string, v as string), [
    STORAGE_KEY,
    JSON.stringify({
      version: 2,
      uiLang: 'en',
      onboarded: true,
      placement: { result: 'START_A1', date: '2026-11-01', correctByLevel: [], mistakeTags: [] },
      plan: { planId: '15-day-start', startedOn: '2026-11-01', completedDays: days, ratings: [], selfCheckStart: [1, 1, 1, 1, 1], selfCheckEnd: null, current: null, finishedOn: null },
    }),
  ]);
  await loadApp(page, 'plan-day');
  await expect(page.getByTestId('plan-day-title')).toHaveText('Day 15 of 15');
  await expect(page.getByTestId('review-day-note')).toBeVisible();
  await page.getByTestId('plan-start-day').click();
  await doPlanDay(page, { rating: 3, knew: true });
  await expect(page.getByTestId('plan-finished')).toBeVisible();

  const p = await stored(page);
  const plan = p?.plan as { finishedOn: string; selfCheckEnd: number[]; ratings: { day: number; rating: number }[]; completedDays: unknown[] };
  expect(plan.finishedOn).toBe('2026-11-15');
  expect(plan.completedDays).toHaveLength(15);
  expect(plan.selfCheckEnd).toEqual([1, 1, 1, 1, 1]);
  expect(plan.ratings).toEqual([{ day: 15, rating: 3 }]);

  await page.getByTestId('plan-progress-link').click();
  await expect(page.getByTestId('progress-end')).toContainText('You can now:');
  await expect(page.getByTestId('progress-end')).toContainText('You cannot yet:');
  await expect(page.getByTestId('goal-intro')).toHaveAttribute('data-reached', 'yes');
  await expect(page.getByTestId('goal-days')).toHaveAttribute('data-reached', 'yes');
  await expect(page.getByTestId('goal-messages')).toHaveAttribute('data-reached', 'no');
  await expectNoOverflow(page, 'day 15 end');
  if (info.project.name === 'chromium') await page.screenshot({ path: join(SHOTS, 'en-25-plan-day15-end.png'), fullPage: true });
});

test('the self-check fits at 320 px', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await welcome(page, 'ar');
  await page.getByTestId('placement-skip').click();
  await page.goto('./#/plans');
  await page.getByTestId('plan-start').click();
  await page.getByTestId('plan-start-day').click();
  await expect(page.getByTestId('self-check-step')).toBeVisible();
  await expectNoOverflow(page, '320 self-check');
  // The statement (legend) sits inside its card, below the top border.
  const inside = await page.evaluate(() =>
    Array.from(document.querySelectorAll('fieldset.card')).every((f) => {
      const legend = f.querySelector('legend');
      return !!legend && legend.getBoundingClientRect().top >= f.getBoundingClientRect().top + 1;
    }),
  );
  expect(inside).toBe(true);
  if (info.project.name === 'chromium') await page.screenshot({ path: join(SHOTS, 'ar-26-self-check-320.png'), fullPage: true });
});
