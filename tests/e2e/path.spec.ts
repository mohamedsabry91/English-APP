import { expect, test } from '@playwright/test';
import { answer, placementAllFirst, stored, welcome } from './helpers';

for (const lang of ['ar', 'en'] as const) {
  test(`full path in ${lang === 'ar' ? 'Arabic' : 'English'}: placement, session, wrong answer, review on a later day`, async ({ page }) => {
    const hosts = new Set<string>();
    page.on('request', (r) => hosts.add(new URL(r.url()).host));

    await page.clock.install({ time: new Date('2026-11-02T09:00:00+03:00') });
    await welcome(page, lang);
    await placementAllFirst(page);
    await expect(page.getByTestId('result-level')).toContainText(lang === 'ar' ? 'بداية A1' : 'Starting A1');
    await expect(page.getByTestId('result-disclaimer')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    await page.getByTestId('result-continue').click();

    // Today -> daily session. No review is due on the first day.
    await expect(page.getByTestId('today-review')).toBeVisible();
    await page.getByTestId('today-start').click();
    await expect(page.getByTestId('lesson-content')).toBeVisible();
    await page.getByTestId('to-exercises').click();

    // First exercise wrong, the rest right.
    const wrongId = await answer(page, false);
    await expect(page.getByTestId('right-answer')).toBeVisible();
    await page.getByTestId('next').click();
    while (await page.getByTestId('check').isVisible()) {
      await answer(page, true);
      await page.getByTestId('next').click();
    }

    // Leave and come back: the session resumes at the writing step.
    await page.reload();
    await page.getByTestId('nav-today').click();
    await page.getByTestId('today-start').click();
    await expect(page.getByTestId('writing-task')).toBeVisible();
    await page.getByTestId('skip-writing').click();
    await expect(page.getByTestId('session-done')).toBeVisible();

    // The wrong answer is a review card, due tomorrow, not today.
    const p = await stored(page);
    const cards = p?.cards as Record<string, { due: string; box: number }>;
    expect(Object.keys(cards)).toEqual([wrongId]);
    expect(cards[wrongId]?.due).toBe('2026-11-03');
    await page.getByTestId('session-home').click();
    await expect(page.getByTestId('today-done')).toBeVisible();

    // My Mistakes shows the mistake type.
    await page.getByTestId('nav-mistakes').click();
    await expect(page.getByTestId('mistake-BE')).toBeVisible();
    await expect(page.getByTestId('not-enough')).toBeVisible();

    // Next day: the card is due, and the review shows it first.
    await page.clock.setFixedTime(new Date('2026-11-03T09:00:00+03:00'));
    await page.reload();
    await page.getByTestId('nav-today').click();
    await expect(page.getByTestId('today-review')).toContainText('1');
    await page.getByTestId('today-start').click();
    await expect(page.getByTestId('exercise')).toHaveAttribute('data-exercise-id', wrongId);
    await answer(page, true);
    await page.getByTestId('next').click();
    const after = await stored(page);
    expect((after?.cards as Record<string, { box: number; due: string }>)[wrongId]).toMatchObject({ box: 2, due: '2026-11-06' });

    // No requests to other hosts during the whole path.
    expect([...hosts]).toEqual(['localhost:4173']);
  });
}
