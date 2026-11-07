import { expect, test } from '@playwright/test';
import { STORAGE_KEY, loadApp, welcome } from './helpers';

// The English course ships computer-voice clips for the phrase cards (Kokoro, not yet checked by a
// teacher). Nothing plays or downloads by itself: a clip is fetched only when "Listen" is pressed,
// and only from the app's own site. Every Listen button carries the honest label.
for (const lang of ['ar', 'en'] as const) {
  test(`phrase clips: Listen with the "not yet checked" label, no audio until pressed (${lang})`, async ({ page }) => {
    const audioRequests: string[] = [];
    page.on('request', (r) => {
      if (/\.opus($|\?)/.test(r.url()) || r.resourceType() === 'media') audioRequests.push(r.url());
    });
    await welcome(page, lang);
    await page.getByTestId('placement-skip').click();
    await page.getByTestId('nav-settings').click();
    await expect(page.getByTestId('audio-offline')).toBeVisible();
    await expect(page.getByTestId('audio-download')).toBeVisible();
    await page.getByTestId('about').click();
    await expect(page.getByTestId('about-audio')).not.toHaveText(lang === 'en' ? 'The app has no sound and no audio.' : 'لا يحتوي التطبيق على أي صوت.');
    expect(audioRequests, 'no clip is fetched before Listen').toEqual([]);

    // Day 1 of the 15-Day Start, at the step that shows the first phrases.
    // A version 2 record, which the app migrates, as in plan.spec.ts.
    await page.evaluate(([k, l]) => {
      localStorage.setItem(k as string, JSON.stringify({
        version: 2,
        uiLang: l,
        onboarded: true,
        placement: { result: 'START_A1', date: '2026-11-01', correctByLevel: [], mistakeTags: [] },
        plan: { planId: '15-day-start', startedOn: '2026-11-07', completedDays: [], ratings: [], selfCheckStart: [1, 1, 1, 1, 1], selfCheckEnd: null, current: { day: 1, step: 2 }, finishedOn: null },
      }));
    }, [STORAGE_KEY, lang]);
    await loadApp(page, 'plan-day');
    await expect(page.getByTestId('learn-step')).toHaveAttribute('data-phrase-id', 'ph-01');
    await expect(page.getByTestId('audio-play')).toBeVisible();
    await expect(page.getByTestId('audio-synthetic')).toHaveText(lang === 'en' ? 'Computer voice, not yet checked by a teacher' : 'صوت حاسوبي، لم يراجعه معلّم بعد');
    expect(audioRequests).toEqual([]);

    const clip = page.waitForResponse((r) => r.url().endsWith('/audio/en-from-ar/ph-01.opus'));
    await page.getByTestId('audio-play').click();
    const res = await clip;
    expect(res.status()).toBeLessThan(400);
    expect(new URL(res.url()).origin).toBe(new URL(page.url()).origin);
  });
}
