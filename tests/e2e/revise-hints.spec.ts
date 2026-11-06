import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { answer, expectNoOverflow, stored, welcome } from './helpers';

async function checkScreen(page: Page, label: string) {
  await expectNoOverflow(page, label);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const bad = axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(bad.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`), label).toEqual([]);
}

for (const width of [320, 375]) {
  for (const lang of ['ar', 'en'] as const) {
    test(`revise once: try again shows which marks went away and which remain (${lang}, ${width} px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await welcome(page, lang);
      await page.getByTestId('placement-skip').click();
      await page.goto('./#/writing/w-g-a1-01');
      await page.getByTestId('writing-input').fill('My name is Sami. I am engineer. He go to work early.');
      await page.getByTestId('writing-check').click();
      await expect(page.getByTestId('finding')).toHaveCount(2);
      await expect(page.getByTestId('revise-offer')).toBeVisible();
      await checkScreen(page, `${lang} ${width} first check`);

      // Fix one of the two mistakes and check once more.
      await page.getByTestId('writing-revise').click();
      await expect(page.getByTestId('revise-input')).toHaveValue('My name is Sami. I am engineer. He go to work early.');
      await page.getByTestId('revise-input').fill('My name is Sami. I am engineer. He goes to work early.');
      await checkScreen(page, `${lang} ${width} revising`);
      await page.getByTestId('writing-recheck').click();

      const result = page.getByTestId('revise-result');
      await expect(result).toBeVisible();
      await expect(page.getByTestId('revise-fixed').locator('li')).toHaveCount(1);
      await expect(page.getByTestId('revise-fixed').locator('li')).toHaveAttribute('data-tag', 'SVA');
      await expect(page.getByTestId('revise-remaining').locator('li')).toHaveCount(1);
      await expect(page.getByTestId('revise-remaining').locator('li')).toHaveAttribute('data-tag', 'ARTICLE');
      await expect(page.getByTestId('revise-added')).toHaveCount(0);
      // Once per check: no second "Try again".
      await expect(page.getByTestId('writing-revise')).toHaveCount(0);
      await expect(page.getByTestId('finding')).toHaveCount(1);
      // No score, percentage or streak.
      const body = (await page.locator('body').innerText()).toLowerCase();
      expect(body).not.toMatch(/%|score|streak|\/100|out of|perfect|نقاط|سلسلة|٪/);
      await checkScreen(page, `${lang} ${width} after second try`);

      await page.getByTestId('writing-done').click();
      const p = await stored(page);
      // Nothing new is saved: no text, only the first check's tags (and dates), as before.
      expect(JSON.stringify(p)).not.toContain('He go');
      expect(JSON.stringify(p)).not.toContain('He goes to work');
      expect(p?.writingDraft).toBeNull();
      const tags = (p?.mistakeLog as { tag: string; source: string }[]).filter((e) => e.source === 'writing').map((e) => e.tag).sort();
      expect(tags).toEqual(['ARTICLE', 'SVA']);
      expect(p?.completedWriting).toEqual(['w-g-a1-01']);
    });
  }
}

test('revise once can be skipped, and is not offered when nothing is marked', async ({ page }) => {
  await welcome(page, 'en');
  await page.getByTestId('placement-skip').click();
  await page.goto('./#/writing/w-g-a1-01');
  await page.getByTestId('writing-input').fill('My name is Sami. I am an engineer. I am at work now.');
  await page.getByTestId('writing-check').click();
  await expect(page.getByTestId('nothing-marked')).toBeVisible();
  await expect(page.getByTestId('revise-offer')).toHaveCount(0);
  await page.getByTestId('writing-edit').click();
  await page.getByTestId('writing-input').fill('He go to work.');
  await page.getByTestId('writing-check').click();
  await expect(page.getByTestId('revise-offer')).toBeVisible();
  // Skip: finish straight away.
  await page.getByTestId('writing-done').click();
  const tags = ((await stored(page))?.mistakeLog as { tag: string; source: string }[]).filter((e) => e.source === 'writing').map((e) => e.tag);
  expect(tags).toEqual(['SVA']);
});

test('cancelling the second try keeps the first text as the saved draft', async ({ page }) => {
  await welcome(page, 'en');
  await page.getByTestId('placement-skip').click();
  await page.goto('./#/writing/w-g-a1-01');
  await page.getByTestId('writing-input').fill('He go to work.');
  await page.getByTestId('writing-check').click();
  await page.getByTestId('writing-revise').click();
  await page.getByTestId('revise-input').fill('He goes to work every day.');
  await page.getByTestId('writing-revise-cancel').click();
  await expect.poll(async () => (await stored(page))?.writingDraft).toEqual({ taskId: 'w-g-a1-01', text: 'He go to work.' });
  await page.reload();
  await expect(page.getByTestId('writing-input')).toHaveValue('He go to work.');
});

test('a new mistake made in the second try is shown and counted', async ({ page }) => {
  await welcome(page, 'en');
  await page.getByTestId('placement-skip').click();
  await page.goto('./#/writing/w-g-a1-01');
  await page.getByTestId('writing-input').fill('He go to work.');
  await page.getByTestId('writing-check').click();
  await page.getByTestId('writing-revise').click();
  await page.getByTestId('revise-input').fill('He goes to work. I am engineer.');
  await page.getByTestId('writing-recheck').click();
  await expect(page.getByTestId('revise-fixed').locator('li')).toHaveAttribute('data-tag', 'SVA');
  await expect(page.getByTestId('revise-added').locator('li')).toHaveAttribute('data-tag', 'ARTICLE');
  await page.getByTestId('writing-done').click();
  const tags = ((await stored(page))?.mistakeLog as { tag: string; source: string }[]).filter((e) => e.source === 'writing').map((e) => e.tag).sort();
  expect(tags).toEqual(['ARTICLE', 'SVA']);
});

for (const width of [320, 375]) {
  for (const lang of ['ar', 'en'] as const) {
    test(`Arabic-speaker hints after a wrong answer and in My Mistakes (${lang}, ${width} px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await welcome(page, lang);
      await page.getByTestId('placement-skip').click();
      await page.goto('./#/lesson/g-a1-01');
      await page.getByTestId('to-exercises').click();
      // A right answer shows no hint; a wrong one shows the hint for its tag.
      await answer(page, true);
      await expect(page.getByTestId('feedback')).toHaveAttribute('data-correct', 'yes');
      await expect(page.getByTestId('tag-hint')).toHaveCount(0);
      await page.getByTestId('next').click();
      await answer(page, false);
      await expect(page.getByTestId('feedback')).toHaveAttribute('data-correct', 'no');
      const hint = page.getByTestId('tag-hint');
      await expect(hint).toBeVisible();
      await expect(hint).toContainText(lang === 'ar' ? 'لماذا قد يحدث هذا' : 'Why this may happen');
      await expect(hint.locator('p[lang="ar"]').first()).toHaveText(/^قد /);
      await checkScreen(page, `${lang} ${width} hint after wrong answer`);

      await page.getByTestId('nav-mistakes').click();
      const item = page.locator('[data-testid^="mistake-"]').first();
      await expect(item.getByTestId('tag-hint')).toBeVisible();
      await checkScreen(page, `${lang} ${width} mistakes with hint`);
    });
  }
}
