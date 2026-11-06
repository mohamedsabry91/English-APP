import { describe, expect, it } from 'vitest';
import { check } from '../../src/checker';
import { compareChecks } from '../../src/app/revise';

const run = (a: string, b: string) => compareChecks(a, check(a, 'A1'), b, check(b, 'A1'));

describe('revise once: comparing two checks', () => {
  it('shows the flags that went away and the ones that remain', () => {
    const first = 'He go to work. She happy.';
    const before = check(first, 'A1');
    expect(before.length).toBeGreaterThanOrEqual(2);
    const r = run(first, 'He goes to work. She happy.');
    expect(r.fixed.map((m) => m.finding.tag)).toContain('SVA');
    expect(r.remaining.map((m) => m.finding.tag)).toContain('BE');
    expect(r.added).toEqual([]);
  });

  it('shows everything as fixed when the new text has no flags', () => {
    const first = 'He go to work.';
    const r = run(first, 'He goes to work.');
    expect(r.fixed.length).toBe(check(first, 'A1').length);
    expect(r.remaining).toEqual([]);
    expect(r.added).toEqual([]);
  });

  it('shows a new mistake in the revised text as added', () => {
    const r = run('He goes to work.', 'He go to work.');
    expect(r.fixed).toEqual([]);
    expect(r.added.map((m) => m.finding.tag)).toContain('SVA');
  });

  it('matches the same mistake even if it moved in the text, and ignores case', () => {
    const r = run('He go to work.', 'Today he GO to work.');
    const sva = r.remaining.find((m) => m.finding.tag === 'SVA');
    expect(sva).toBeDefined();
    expect(r.fixed.filter((m) => m.finding.tag === 'SVA')).toEqual([]);
  });

  it('counts each flag once when the same mistake appears twice', () => {
    const first = 'He go home. She go home.';
    const before = check(first, 'A1').filter((f) => f.tag === 'SVA');
    const r = run(first, 'He goes home. She go home.');
    expect(r.remaining.filter((m) => m.finding.tag === 'SVA').length + r.fixed.filter((m) => m.finding.tag === 'SVA').length).toBe(before.length);
  });
});
