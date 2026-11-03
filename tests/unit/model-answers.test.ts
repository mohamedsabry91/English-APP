import { describe, expect, it } from 'vitest';
import { WRITING_TASKS, LESSONS } from '../../src/core/content';
import { check } from '../../src/checker';

// Model answers and lesson example sentences are correct English, so the checker must not mark them.
describe('checker on our own correct content', () => {
  it('finds nothing in any model answer', () => {
    const bad = WRITING_TASKS.flatMap((t) => check(t.modelAnswer, t.level).map((f) => `${t.id}: ${f.tag} "${t.modelAnswer.slice(f.start, f.end)}"`));
    expect(bad).toEqual([]);
  });

  it('finds nothing in lesson examples', () => {
    const bad = LESSONS.flatMap((l) => l.examples.flatMap((e) => check(e.en, l.level).map((f) => `${l.id}: ${f.tag} "${e.en}"`)));
    expect(bad).toEqual([]);
  });

  it('finds nothing in the accepted answers of find-and-fix exercises', () => {
    const bad = LESSONS.flatMap((l) =>
      l.exercises.flatMap((ex) => (ex.type === 'fix' ? ex.accepted.flatMap((a) => check(a, l.level).map((f) => `${ex.id}: ${f.tag} "${a}"`)) : [])),
    );
    expect(bad).toEqual([]);
  });
});
