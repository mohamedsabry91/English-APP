import { describe, expect, it } from 'vitest';
import { hasEnoughForTrend, topTags, weeklyCounts } from '../../src/core/stats';
import { weekStart } from '../../src/core/dates';
import type { MistakeLogEntry } from '../../src/core/types';

const log: MistakeLogEntry[] = [
  { date: '2026-11-02', tag: 'BE', source: 'lesson', count: 3 },
  { date: '2026-11-01', tag: 'ARTICLE', source: 'placement', count: 2 },
  { date: '2026-10-20', tag: 'BE', source: 'review', count: 1 },
  { date: '2026-10-20', tag: 'SVA', source: 'writing', count: 1 },
  { date: '2025-01-01', tag: 'SVA', source: 'writing', count: 5 },
];

describe('stats', () => {
  it('week starts on Monday', () => {
    expect(weekStart('2026-11-02')).toBe('2026-11-02'); // Monday
    expect(weekStart('2026-11-08')).toBe('2026-11-02'); // Sunday
    expect(weekStart('2026-11-01')).toBe('2026-10-26');
  });

  it('top tags counts all sources and marks placement', () => {
    const top = topTags(log);
    expect(top[0]).toEqual({ tag: 'SVA', count: 6, fromPlacement: 0 });
    expect(top[1]).toEqual({ tag: 'BE', count: 4, fromPlacement: 0 });
    expect(top[2]).toEqual({ tag: 'ARTICLE', count: 2, fromPlacement: 2 });
  });

  it('weekly counts cover 8 weeks, skip placement and old data', () => {
    const w = weeklyCounts(log, '2026-11-04');
    expect(w).toHaveLength(8);
    expect(w[7]).toEqual({ week: '2026-11-02', count: 3 });
    expect(w.find((x) => x.week === '2026-10-26')?.count).toBe(0); // placement only
    expect(w.find((x) => x.week === '2026-10-19')?.count).toBe(2);
    expect(w.reduce((s, x) => s + x.count, 0)).toBe(5);
  });

  it('needs two weeks of data for a trend', () => {
    expect(hasEnoughForTrend(weeklyCounts(log, '2026-11-04'))).toBe(true);
    expect(hasEnoughForTrend(weeklyCounts(log.slice(0, 2), '2026-11-04'))).toBe(false);
    expect(hasEnoughForTrend(weeklyCounts([], '2026-11-04'))).toBe(false);
  });
});
