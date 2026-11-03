import { describe, expect, it } from 'vitest';
import fixture from '../fixtures/writing-checker.json';
import { check, startsWithVowelSound } from '../../src/checker';

interface Item {
  text: string;
  expect: string | null;
  level?: 'A1' | 'A2' | 'B1' | 'B2';
  allowBasics?: boolean;
}
const items = (fixture as { items: Item[] }).items;
const mistakes = items.filter((i) => i.expect !== null);
const correct = items.filter((i) => i.expect === null);

describe('checker fixture', () => {
  it('has at least 120 sentences: 70+ with a mistake, 50+ correct', () => {
    expect(items.length).toBeGreaterThanOrEqual(120);
    expect(mistakes.length).toBeGreaterThanOrEqual(70);
    expect(correct.length).toBeGreaterThanOrEqual(50);
  });

  it('catches at least 80% of the listed mistakes with the right tag', () => {
    const missed: string[] = [];
    for (const m of mistakes) {
      const tags = check(m.text, m.level ?? 'B1').map((f) => f.tag);
      if (!tags.includes(m.expect as never)) missed.push(`${m.expect}: ${m.text} -> [${tags.join(', ')}]`);
    }
    const rate = (mistakes.length - missed.length) / mistakes.length;
    console.log(`Checker caught ${mistakes.length - missed.length} of ${mistakes.length} (${(rate * 100).toFixed(1)}%).`);
    if (missed.length) console.log('Missed:\n' + missed.join('\n'));
    expect(rate).toBeGreaterThanOrEqual(0.8);
  });

  it('gives zero findings on correct sentences', () => {
    const wrong: string[] = [];
    for (const c of correct) {
      const f = check(c.text, c.level ?? 'B1').filter((x) => !(c.allowBasics && (x.tag === 'CAPITAL' || x.tag === 'PUNCTUATION')));
      if (f.length) wrong.push(`${c.text} -> ${f.map((x) => `${x.tag}(${c.text.slice(x.start, x.end)})`).join(', ')}`);
    }
    if (wrong.length) console.log('False positives:\n' + wrong.join('\n'));
    expect(wrong).toEqual([]);
  });
});

describe('checker details', () => {
  it('judges a and an by sound', () => {
    expect(startsWithVowelSound('university')).toBe(false);
    expect(startsWithVowelSound('hour')).toBe(true);
    expect(startsWithVowelSound('MSc')).toBe(true);
    expect(startsWithVowelSound('apple')).toBe(true);
    expect(startsWithVowelSound('one')).toBe(false);
    expect(check('He is a engineer.').map((f) => f.tag)).toEqual(['ARTICLE']);
    expect(check('An university is near.').map((f) => f.tag)).toEqual(['ARTICLE']);
  });

  it('gives positions, Arabic and English explanations, and safe suggestions', () => {
    const text = 'I need more informations.';
    const [f] = check(text);
    expect(f).toBeDefined();
    expect(text.slice(f!.start, f!.end)).toBe('informations');
    expect(f!.suggestion).toBe('information');
    expect(f!.explanationAr).toMatch(/[؀-ۿ]/);
    expect(f!.explanationEn).not.toMatch(/[؀-ۿ]/);
  });

  it('does not flag unknown words', () => {
    expect(check('The xyzzy flange is ready.')).toEqual([]);
  });

  it('accepts an email that ends with a sign-off and a name', () => {
    expect(check('Dear Ms. Salem,\nThe drawings are attached.\nBest regards,\nOmar')).toEqual([]);
  });

  it('handles empty text', () => {
    expect(check('')).toEqual([]);
    expect(check('   ')).toEqual([]);
  });
});
