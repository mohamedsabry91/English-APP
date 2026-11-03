import { describe, expect, it } from 'vitest';
import { PLACEMENT, TAGS } from '../../src/core/content';
import { LEVELS } from '../../src/core/types';

describe('placement content', () => {
  it('has 32 questions, 8 per level, easier to harder', () => {
    expect(PLACEMENT).toHaveLength(32);
    for (const level of LEVELS) expect(PLACEMENT.filter((q) => q.level === level)).toHaveLength(8);
    const order = PLACEMENT.map((q) => LEVELS.indexOf(q.level));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('every question has unique id, a valid answer, unique options and a known tag', () => {
    const ids = new Set(PLACEMENT.map((q) => q.id));
    expect(ids.size).toBe(PLACEMENT.length);
    const tagIds = TAGS.map((t) => t.id);
    for (const q of PLACEMENT) {
      expect(q.answer, q.id).toBeGreaterThanOrEqual(0);
      expect(q.answer, q.id).toBeLessThan(q.options.length);
      expect(new Set(q.options.map((o) => o.toLowerCase())).size, q.id).toBe(q.options.length);
      if (q.tag !== null) expect(tagIds, q.id).toContain(q.tag);
    }
  });
});
