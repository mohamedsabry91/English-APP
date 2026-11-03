import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, type Page } from '@playwright/test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const LESSON_DIR = join(ROOT, 'content', 'en-from-ar', 'lessons');

interface Ex {
  id: string;
  type: 'mc' | 'fill' | 'reorder' | 'fix';
  answer?: number;
  options?: string[];
  accepted?: string[];
  words?: string[];
}
const EXERCISES = new Map<string, Ex>();
for (const f of readdirSync(LESSON_DIR)) {
  const l = JSON.parse(readFileSync(join(LESSON_DIR, f), 'utf8')) as { exercises: Ex[] };
  for (const e of l.exercises) EXERCISES.set(e.id, e);
}
// Story questions in the 15-Day Start plan are multiple choice too.
const STORY_FILE = join(ROOT, 'content', 'en-from-ar', 'stories.json');
for (const st of (JSON.parse(readFileSync(STORY_FILE, 'utf8')) as { stories: { questions: { id: string; options: string[]; answer: number }[] }[] }).stories) {
  for (const q of st.questions) EXERCISES.set(q.id, { id: q.id, type: 'mc', options: q.options, answer: q.answer });
}

export const STORAGE_KEY = 'english-practice:progress';

/** Finish the welcome screen in the given language. */
export async function welcome(page: Page, lang: 'ar' | 'en') {
  await page.goto('./');
  await page.getByTestId(`lang-${lang}`).click();
  await expect(page.locator('html')).toHaveAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  await expect(page.locator('html')).toHaveAttribute('lang', lang);
  await page.getByTestId('welcome-continue').click();
}

/** Answer the placement test choosing option 0 every time (this stops early, at "Starting A1"). */
export async function placementAllFirst(page: Page) {
  await page.getByTestId('placement-start').click();
  for (let i = 0; i < 40; i++) {
    if (!(await page.getByTestId('placement-next').isVisible())) break;
    await page.getByTestId('placement-option-0').click();
    await page.getByTestId('placement-next').click();
  }
  await expect(page.getByTestId('result-level')).toBeVisible();
}

async function currentExercise(page: Page): Promise<Ex> {
  const id = await page.getByTestId('exercise').getAttribute('data-exercise-id');
  const ex = id ? EXERCISES.get(id) : undefined;
  if (!ex) throw new Error(`Unknown exercise ${id}`);
  return ex;
}

/** Answer the exercise on screen, right or wrong, using the content files. */
export async function answer(page: Page, correct: boolean): Promise<string> {
  const ex = await currentExercise(page);
  const box = page.getByTestId('exercise');
  if (ex.type === 'mc') {
    const n = ex.options?.length ?? 2;
    const pick = correct ? (ex.answer as number) : ((ex.answer as number) + 1) % n;
    await box.getByTestId(`option-${pick}`).click();
  } else if (ex.type === 'reorder') {
    const target = correct ? (ex.words as string[]) : [...(ex.words as string[])].reverse();
    for (const w of target) {
      await box.locator('.word-bank button', { hasText: new RegExp(`^${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).first().click();
    }
  } else {
    await box.getByTestId('answer-input').fill(correct ? (ex.accepted as string[])[0] as string : 'zzz');
  }
  await page.getByTestId('check').click();
  await expect(page.getByTestId('feedback')).toHaveAttribute('data-correct', correct ? 'yes' : 'no');
  return ex.id;
}

/** Read the saved progress record exactly as stored (version 3: shared settings plus courses[id]). */
export async function storedRaw(page: Page): Promise<Record<string, unknown> | null> {
  const raw = await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
}

/**
 * Read the saved progress of the active course, together with the shared settings, in one flat object.
 * A record seeded in an older version (1 or 2) stays as it is until the app next saves, so it is returned as stored.
 */
export async function stored(page: Page): Promise<Record<string, unknown> | null> {
  const raw = await storedRaw(page);
  if (!raw) return null;
  if (raw.version !== 3) return raw;
  const courses = raw.courses as Record<string, Record<string, unknown>>;
  const { courses: _courses, activeCourse, ...shared } = raw;
  void _courses;
  return { ...shared, activeCourse, ...(courses[activeCourse as string] ?? {}) };
}

/** Fail if the page scrolls sideways. */
export async function expectNoOverflow(page: Page, label: string) {
  const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sw, `${label}: scrollWidth ${sw} > clientWidth ${cw}`).toBeLessThanOrEqual(cw);
}
