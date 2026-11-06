import { expect, test } from '@playwright/test';
import { welcome } from './helpers';

// The English course ships no audio yet. The app must look and work exactly as before:
// no audio controls, no download button, and the About text still says there is no sound.
for (const lang of ['ar', 'en'] as const) {
  test(`with no audio in the course, no audio controls are shown (${lang})`, async ({ page }) => {
    const audioRequests: string[] = [];
    page.on('request', (r) => {
      if (/\.opus($|\?)/.test(r.url()) || r.resourceType() === 'media') audioRequests.push(r.url());
    });
    await welcome(page, lang);
    await page.getByTestId('placement-skip').click();
    await page.getByTestId('nav-settings').click();
    await expect(page.getByTestId('export')).toBeVisible();
    await expect(page.getByTestId('audio-offline')).toHaveCount(0);
    await expect(page.getByTestId('audio-download')).toHaveCount(0);
    await page.getByTestId('about').click();
    await expect(page.getByTestId('about-audio')).toHaveText(lang === 'en' ? 'The app has no sound and no audio.' : 'لا يحتوي التطبيق على أي صوت.');
    await expect(page.locator('audio')).toHaveCount(0);
    expect(audioRequests).toEqual([]);
  });
}
