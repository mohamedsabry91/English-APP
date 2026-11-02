import { describe, expect, it } from 'vitest';
import { placementState, scorePlacement, shouldStopAfterLevel, startLevel } from '../../src/core/placement';
import type { Level } from '../../src/core/types';

describe('placement scoring', () => {
  it('6 of 8 passes, 5 of 8 does not', () => {
    expect(scorePlacement([6])).toBe('A1');
    expect(scorePlacement([5])).toBe('START_A1');
    expect(scorePlacement([8, 6, 6, 6])).toBe('B2');
    expect(scorePlacement([8, 6, 6, 5])).toBe('B1');
  });

  it('"Starting A1" when A1 is not passed', () => {
    expect(scorePlacement([0])).toBe('START_A1');
    expect(scorePlacement([4])).toBe('START_A1');
    expect(scorePlacement([])).toBe('START_A1');
  });

  it('needs every lower level passed', () => {
    expect(scorePlacement([8, 5, 8, 8])).toBe('A1');
    expect(scorePlacement([5, 8, 8, 8])).toBe('START_A1');
    expect(scorePlacement([7, 7, 4])).toBe('A2');
  });

  it('early stop after a level with 4 or fewer correct', () => {
    expect(shouldStopAfterLevel(4)).toBe(true);
    expect(shouldStopAfterLevel(0)).toBe(true);
    expect(shouldStopAfterLevel(5)).toBe(false);
    expect(shouldStopAfterLevel(8)).toBe(false);
  });

  it('start level follows the result', () => {
    expect(startLevel('START_A1')).toBe('A1');
    expect(startLevel('A1')).toBe('A2');
    expect(startLevel('A2')).toBe('B1');
    expect(startLevel('B1')).toBe('B2');
    expect(startLevel('B2')).toBe('B2');
  });
});

describe('placement state', () => {
  const levels: Level[] = ['A1', 'A2', 'B1', 'B2'];
  const qs = levels.flatMap((level) => Array.from({ length: 8 }, () => ({ level, answer: 0 })));
  const ans = (pattern: number[]) => pattern.flatMap((n) => Array.from({ length: 8 }, (_, i) => (i < n ? 0 : 1)));

  it('stops early after A1 with 4 correct', () => {
    const s = placementState(qs, ans([4]));
    expect(s).toEqual({ correctByLevel: [4], finished: true, next: -1 });
    expect(scorePlacement(s.correctByLevel)).toBe('START_A1');
  });

  it('continues after 5 correct (not passed, but no early stop)', () => {
    const s = placementState(qs, ans([5]));
    expect(s.finished).toBe(false);
    expect(s.next).toBe(8);
  });

  it('runs all 32 questions when every level scores 5 or more', () => {
    const s = placementState(qs, ans([8, 7, 6, 5]));
    expect(s).toEqual({ correctByLevel: [8, 7, 6, 5], finished: true, next: -1 });
    expect(scorePlacement(s.correctByLevel)).toBe('B1');
  });

  it('reports the next unanswered question mid-level', () => {
    const a: (number | null)[] = ans([8]).concat([0, 0, 0]);
    expect(placementState(qs, a)).toEqual({ correctByLevel: [8], finished: false, next: 11 });
    expect(placementState(qs, []).next).toBe(0);
  });

  it('stops after B1 with a fail', () => {
    const s = placementState(qs, ans([8, 8, 3]));
    expect(s.finished).toBe(true);
    expect(scorePlacement(s.correctByLevel)).toBe('A2');
  });
});
