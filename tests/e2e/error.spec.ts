import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { STORAGE_KEY, expectNoOverflow, stored, loadApp, openApp } from './helpers';

const progress = (lang: 'ar' | 'en') => ({ version: 1, uiLang: lang, onboarded: true, track: 'general', completedLessons: ['g-a1-01'] });

for (const lang of ['ar', 'en'] as const) {
  test(`a render error shows the recovery screen, and reset asks before deleting (${lang})`, async ({ page }) => {
    // While the flag is set, reading the date throws, so the Today screen fails to render.
    await page.addInitScript(() => {
      const real = Date.prototype.getFullYear;
      Date.prototype.getFullYear = function (this: Date) {
        if (sessionStorage.getItem('test-crash') === '1') throw new Error('Test crash');
        return real.call(this);
      };
    });
    await openApp(page);
    await page.evaluate(([k, v]) => {
      localStorage.setItem(k as string, v as string);
      sessionStorage.setItem('test-crash', '1');
    }, [STORAGE_KEY, JSON.stringify(progress(lang))]);
    await loadApp(page, 'today');

    const screen = page.getByTestId('error-screen');
    await expect(screen).toBeVisible();
    await expect(screen).toContainText('حدث خطأ');
    await expect(screen).toContainText('Something went wrong');
    await expectNoOverflow(page, `error screen ${lang}`);
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);

    // Cancel keeps the data.
    await page.getByTestId('error-reset').click();
    await expect(page.getByTestId('confirm-dialog')).toBeVisible();
    await page.getByTestId('confirm-no').click();
    await expect(page.getByTestId('confirm-dialog')).toHaveCount(0);
    expect((await stored(page))?.completedLessons).toEqual(['g-a1-01']);

    // Reload keeps the data and still recovers safely while the error remains.
    await page.getByTestId('error-reload').click();
    await expect(page.getByTestId('error-screen')).toBeVisible();
    expect((await stored(page))?.completedLessons).toEqual(['g-a1-01']);

    // Confirmed reset deletes the progress and starts again.
    await page.evaluate(() => sessionStorage.removeItem('test-crash'));
    await page.getByTestId('error-reset').click();
    await page.getByTestId('confirm-yes').click();
    await expect(page.getByTestId('welcome-continue')).toBeVisible();
    expect(await stored(page)).toBeNull();
  });
}
