import { expect, test } from '@playwright/test';

test('first open shows Arabic RTL by default', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await page.getByTestId('lang-en').click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
});
