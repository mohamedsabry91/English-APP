import type { Page } from '@playwright/test';

/** Finish the welcome screen in the given language. */
export async function welcome(page: Page, lang: 'ar' | 'en') {
  await page.goto('./');
  await page.getByTestId(`lang-${lang}`).click();
  await page.getByTestId('welcome-continue').click();
}

/** Answer the placement test: choose option 0 for every question until it ends. */
export async function placementAllFirst(page: Page) {
  await page.getByTestId('placement-start').click();
  for (let i = 0; i < 40; i++) {
    if (!(await page.getByTestId('placement-next').isVisible().catch(() => false))) break;
    await page.getByTestId('placement-option-0').click();
    await page.getByTestId('placement-next').click();
  }
}

/** Answer the current exercise wrongly where possible (choose a wrong option or type nonsense). */
export async function answerWrong(page: Page) {
  const ex = page.getByTestId('exercise');
  const type = await ex.getAttribute('data-type');
  if (type === 'mc') {
    // Try options until one is marked wrong; the first click decides.
    const n = await ex.locator('[data-testid^="option-"]').count();
    // We cannot see the answer, so pick by trial on a fresh exercise: choose the last option.
    await ex.getByTestId(`option-${n - 1}`).click();
  } else if (type === 'reorder') {
    const words = ex.locator('[data-testid^="word-"]');
    const n = await words.count();
    for (let i = 0; i < n; i++) await words.first().click();
  } else {
    await ex.getByTestId('answer-input').fill('zzz');
  }
  await page.getByTestId('check').click();
}

/** Answer the current exercise in any way (used to move through a session). */
export async function answerAny(page: Page) {
  await answerWrong(page);
}
