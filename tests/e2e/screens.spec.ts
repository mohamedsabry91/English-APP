import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { answer, expectNoOverflow, STORAGE_KEY, loadApp } from './helpers';

const SHOTS = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs', 'screenshots');
mkdirSync(SHOTS, { recursive: true });

/** A learner who has used the app for a few weeks. */
function seed(lang: 'ar' | 'en') {
  const card = (id: string, tags: string[], due: string) => ({ id, tags, box: 1, due, lastAnswered: null, mistakes: 1, learned: false, created: '2026-10-10' });
  return {
    version: 1,
    uiLang: lang,
    onboarded: true,
    track: 'both',
    placement: { result: 'A2', date: '2026-10-10', correctByLevel: [8, 6, 4], mistakeTags: ['PREPOSITION', 'TENSE'] },
    placementInProgress: null,
    completedLessons: ['g-b1-01'],
    completedWriting: ['w-g-b1-01'],
    cards: {
      'g-a1-01-e1': card('g-a1-01-e1', ['BE'], '2026-11-01'),
      'g-a1-02-e1': card('g-a1-02-e1', ['ARTICLE'], '2026-11-02'),
      'g-b1-01-e3': card('g-b1-01-e3', ['PREPOSITION'], '2026-11-05'),
    },
    mistakeLog: [
      { date: '2026-10-10', tag: 'PREPOSITION', source: 'placement', count: 1 },
      { date: '2026-10-13', tag: 'ARTICLE', source: 'lesson', count: 3 },
      { date: '2026-10-21', tag: 'BE', source: 'lesson', count: 2 },
      { date: '2026-10-22', tag: 'PREPOSITION', source: 'writing', count: 2 },
      { date: '2026-10-28', tag: 'ARTICLE', source: 'review', count: 1 },
      { date: '2026-11-01', tag: 'SVA', source: 'writing', count: 1 },
    ],
    session: null,
    writingDraft: null,
    lastExport: null,
    createdOn: '2026-10-10',
  };
}

async function check(page: Page, lang: string, name: string, shot: boolean) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoOverflow(page, `${lang} ${name}`);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`), `${lang} ${name}`).toEqual([]);
  if (shot) await page.screenshot({ path: join(SHOTS, `${lang}-${name}.png`), fullPage: true });
}

for (const lang of ['ar', 'en'] as const) {
  test(`main screens in ${lang}: no sideways scroll, no serious axe issues, screenshots`, async ({ page }, info) => {
    const shot = info.project.name === 'chromium';
    await page.clock.install({ time: new Date('2026-11-02T09:00:00+03:00') });

    // First open
    await page.goto('./');
    if (lang === 'en') await page.getByTestId('lang-en').click();
    await expect(page.locator('html')).toHaveAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    await check(page, lang, '01-welcome', shot);
    await page.getByTestId('welcome-continue').click();
    await check(page, lang, '02-placement-intro', shot);
    await page.getByTestId('placement-start').click();
    await page.getByTestId('placement-option-1').click();
    await check(page, lang, '03-placement-question', shot);

    // A learner with some history
    await page.evaluate(([k, v]) => localStorage.setItem(k as string, v as string), [STORAGE_KEY, JSON.stringify(seed(lang))]);
    await page.goto('./#/result');
    await page.reload();
    await expect(page.getByTestId('result-level')).toBeVisible();
    await check(page, lang, '04-result', shot);

    await page.getByTestId('result-continue').click();
    await expect(page.getByTestId('today-review')).toBeVisible();
    await check(page, lang, '05-today', shot);

    await page.getByTestId('today-start').click();
    await expect(page.getByTestId('exercise')).toBeVisible();
    await check(page, lang, '06-review', shot);
    await answer(page, false);
    await check(page, lang, '07-feedback', shot);
    await page.getByTestId('next').click();
    await answer(page, true);
    await page.getByTestId('next').click();
    await expect(page.getByTestId('lesson-content')).toBeVisible();
    await check(page, lang, '08-lesson', shot);
    await page.getByTestId('to-exercises').click();
    await check(page, lang, '09-exercise', shot);

    // Find a reorder exercise to show that widget too.
    await page.goto('./#/lesson/g-a1-03');
    await page.getByTestId('to-exercises').click();
    await answer(page, true);
    await page.getByTestId('next').click();
    await expect(page.getByTestId('exercise')).toHaveAttribute('data-type', 'reorder');
    await check(page, lang, '10-reorder', shot);

    await page.getByTestId('nav-lessons').click();
    await check(page, lang, '11-lessons', shot);
    await page.getByTestId('nav-mistakes').click();
    await expect(page.getByTestId('weekly-chart')).toBeVisible();
    await check(page, lang, '12-mistakes', shot);
    await page.getByTestId('nav-writing').click();
    await check(page, lang, '13-writing-list', shot);
    await page.getByTestId('task-w-e-01').click();
    await page.getByTestId('writing-input').fill('Dear Mr. Hassan,\nI am writing to discuss about the drawings. Could you explain me the new layout?\nBest regards,\nSami');
    await check(page, lang, '14-writing-task', shot);
    await page.getByTestId('writing-check').click();
    await expect(page.getByTestId('writing-result')).toBeVisible();
    await check(page, lang, '15-writing-result', shot);
    await page.getByTestId('nav-settings').click();
    await check(page, lang, '16-settings', shot);
    await page.getByTestId('delete-all').click();
    await check(page, lang, '17-delete-confirm', shot);
    await page.getByTestId('confirm-no').click();
    await page.getByTestId('about').click();
    await expect(page.getByTestId('slogan')).toBeVisible();
    await check(page, lang, '18-about', shot);
  });
}

test('also fits at 320 px and on a desktop', async ({ page }) => {
  for (const size of [{ width: 320, height: 640 }, { width: 1280, height: 800 }]) {
    await page.setViewportSize(size);
    for (const lang of ['ar', 'en'] as const) {
      await page.goto('./');
      await page.evaluate(([k, v]) => localStorage.setItem(k as string, v as string), [STORAGE_KEY, JSON.stringify(seed(lang))]);
      for (const route of ['today', 'lessons', 'mistakes', 'writing', 'writing/w-e-01', 'settings', 'about', 'lesson/e-06']) {
        // One full, fresh load per screen. (A hash change followed at once by reload() can be
        // cancelled by WebKit: "Navigation canceled by policy check".)
        await loadApp(page, route);
        await expect(page.locator('#main')).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', lang);
        await expectNoOverflow(page, `${size.width}px ${lang} ${route}`);
      }
    }
  }
});
