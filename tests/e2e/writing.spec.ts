import { expect, test } from '@playwright/test';
import { stored, welcome } from './helpers';

for (const lang of ['ar', 'en'] as const) {
  test(`writing check marks a known mistake and shows the model answer and honesty sentence (${lang})`, async ({ page }) => {
    await welcome(page, lang);
    await page.getByTestId('placement-skip').click();
    await page.getByTestId('nav-writing').click();
    await page.getByTestId('task-w-g-a1-01').click();
    await page.getByTestId('writing-input').fill('My name is Sami. I am engineer. He go to work early.');
    await page.getByTestId('writing-check').click();

    await expect(page.getByTestId('honesty')).toBeVisible();
    await expect(page.getByTestId('honesty')).toContainText(
      lang === 'ar' ? 'هذا الفحص الآلي يجد بعض الأخطاء الشائعة فقط' : 'This automatic check finds some common mistakes only. A sentence with no marks may still have mistakes.',
    );
    await expect(page.getByTestId('finding-mark')).toHaveCount(2);
    await expect(page.locator('[data-testid="finding"][data-tag="ARTICLE"]')).toBeVisible();
    await expect(page.locator('[data-testid="finding"][data-tag="SVA"]')).toBeVisible();
    await expect(page.getByTestId('model-answer')).toContainText('I am an engineer.');
    await expect(page.getByTestId('self-check').locator('li')).toHaveCount(3);
    // Never a score and never "perfect".
    const body = (await page.locator('body').innerText()).toLowerCase();
    expect(body).not.toMatch(/perfect|no mistakes|\/100|out of 100|100%/);

    // While writing, the draft is saved; after finishing, only tags and dates stay.
    await page.getByTestId('writing-done').click();
    const p = await stored(page);
    expect(JSON.stringify(p)).not.toContain('He go to work');
    const tags = (p?.mistakeLog as { tag: string; source: string }[]).filter((e) => e.source === 'writing').map((e) => e.tag).sort();
    expect(tags).toEqual(['ARTICLE', 'SVA']);
  });
}

test('a correct text gets no marks but still shows the honesty sentence', async ({ page }) => {
  await welcome(page, 'en');
  await page.getByTestId('placement-skip').click();
  await page.goto('./#/writing/w-g-a1-01');
  await page.getByTestId('writing-input').fill('My name is Sami. I am an engineer. I am at work now.');
  await page.getByTestId('writing-check').click();
  await expect(page.getByTestId('nothing-marked')).toBeVisible();
  await expect(page.getByTestId('honesty')).toBeVisible();
});
