import { describe, expect, it } from 'vitest';
import { isCorrect, normalizeAnswer, shuffleWords } from '../../src/core/answers';
import type { Exercise } from '../../src/core/contentTypes';

describe('answers', () => {
  it('normalizes case, spaces, curly quotes and final punctuation', () => {
    expect(normalizeAnswer('  He  doesn’t   work. ')).toBe("he doesn't work");
    expect(normalizeAnswer('Is it ready ?')).toBe('is it ready');
  });

  it('checks each exercise type', () => {
    const mc: Exercise = { id: 'a', type: 'mc', tags: [], explanationAr: 'ش', prompt: 'x', options: ['a', 'b'], answer: 1 };
    expect(isCorrect(mc, { kind: 'choice', index: 1 })).toBe(true);
    expect(isCorrect(mc, { kind: 'choice', index: 0 })).toBe(false);
    const fill: Exercise = { id: 'b', type: 'fill', tags: [], explanationAr: 'ش', prompt: 'I ___ tired.', accepted: ['am', "'m"] };
    expect(isCorrect(fill, { kind: 'text', text: ' AM ' })).toBe(true);
    expect(isCorrect(fill, { kind: 'text', text: 'is' })).toBe(false);
    const ro: Exercise = { id: 'c', type: 'reorder', tags: [], explanationAr: 'ش', words: ['I', 'like', 'tea.'], alsoAccepted: [] };
    expect(isCorrect(ro, { kind: 'order', words: ['I', 'like', 'tea.'] })).toBe(true);
    expect(isCorrect(ro, { kind: 'order', words: ['like', 'I', 'tea.'] })).toBe(false);
    const fix: Exercise = { id: 'd', type: 'fix', tags: [], explanationAr: 'ش', sentence: 'He go.', accepted: ['He goes.'] };
    expect(isCorrect(fix, { kind: 'text', text: 'he goes' })).toBe(true);
    expect(isCorrect(fix, { kind: 'text', text: 'He go.' })).toBe(false);
  });

  it('shuffles deterministically and never returns the correct order', () => {
    const w = ['The', 'pump', 'is', 'working.'];
    const a = shuffleWords(w, 'x1');
    expect(a).toEqual(shuffleWords(w, 'x1'));
    expect(a).not.toEqual(w);
    expect([...a].sort()).toEqual([...w].sort());
  });
});
