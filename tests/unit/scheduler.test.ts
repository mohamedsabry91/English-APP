import { describe, expect, it } from 'vitest';
import { BOX_GAPS, dueCards, recordRight, recordWrong } from '../../src/core/scheduler';
import { addDays } from '../../src/core/dates';
import type { ReviewCard } from '../../src/core/types';

const D = '2026-11-02';

describe('scheduler', () => {
  it('a wrong answer creates a card in box 1, due tomorrow', () => {
    const c = recordWrong(undefined, 'x', ['BE'], D);
    expect(c).toMatchObject({ id: 'x', box: 1, due: '2026-11-03', mistakes: 1, learned: false, lastAnswered: D, created: D });
  });

  it('each right answer moves up one box with gaps 1, 3, 7, 14, 30', () => {
    let c = recordWrong(undefined, 'x', ['BE'], D);
    let day: string;
    for (let box = 2; box <= 5; box++) {
      day = c.due;
      c = recordRight(c, day);
      expect(c.box).toBe(box);
      expect(c.due).toBe(addDays(day, BOX_GAPS[box - 1] as number));
      expect(c.learned).toBe(false);
    }
    expect(BOX_GAPS).toEqual([1, 3, 7, 14, 30]);
  });

  it('a right answer in the last box marks the card learned', () => {
    const c: ReviewCard = { id: 'x', tags: [], box: 5, due: D, lastAnswered: null, mistakes: 1, learned: false, created: D };
    const r = recordRight(c, D);
    expect(r.learned).toBe(true);
    expect(dueCards([r], addDays(D, 400))).toEqual([]);
  });

  it('a wrong answer resets to box 1 and adds a mistake', () => {
    const c: ReviewCard = { id: 'x', tags: ['BE'], box: 4, due: D, lastAnswered: '2026-10-01', mistakes: 2, learned: false, created: '2026-09-01' };
    const r = recordWrong(c, 'x', ['ARTICLE'], D);
    expect(r).toMatchObject({ box: 1, due: '2026-11-03', mistakes: 3, created: '2026-09-01' });
    expect(r.tags.sort()).toEqual(['ARTICLE', 'BE']);
  });

  it('a card answered today is not shown again today', () => {
    const c = recordWrong(undefined, 'x', [], D);
    expect(dueCards([c], D)).toEqual([]);
    expect(dueCards([c], addDays(D, 1))).toHaveLength(1);
    const forced = { ...c, due: D };
    expect(dueCards([forced], D)).toEqual([]);
  });

  it('shows at most 5, oldest first, even after a long absence', () => {
    const cards: ReviewCard[] = [];
    for (let i = 0; i < 40; i++) {
      cards.push({ id: `c${i}`, tags: [], box: 1, due: addDays('2026-01-01', i), lastAnswered: null, mistakes: 1, learned: false, created: '2026-01-01' });
    }
    const due = dueCards(cards.slice().reverse(), '2026-11-02');
    expect(due.map((c) => c.id)).toEqual(['c0', 'c1', 'c2', 'c3', 'c4']);
  });

  it('cards not yet due are not shown', () => {
    const c: ReviewCard = { id: 'x', tags: [], box: 2, due: '2026-11-05', lastAnswered: null, mistakes: 1, learned: false, created: D };
    expect(dueCards([c], D)).toEqual([]);
    expect(dueCards([c], '2026-11-05')).toHaveLength(1);
  });

  it('accepts a record as well as a list', () => {
    const c = recordWrong(undefined, 'x', [], '2026-10-01');
    expect(dueCards({ x: c }, D)).toHaveLength(1);
  });
});
