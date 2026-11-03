// Answer checking for exercises. Pure functions.
import type { Exercise } from './contentTypes';

/** Normalize typed text: trim, lowercase, straight quotes, single spaces, no final punctuation. */
export function normalizeAnswer(s: string): string {
  return s
    .normalize('NFKC')
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s*([.!?,;:])\s*$/g, '')
    .replace(/\s+([,.!?;:])/g, '$1')
    .trim();
}

export type Response = { kind: 'choice'; index: number } | { kind: 'text'; text: string } | { kind: 'order'; words: string[] };

export function isCorrect(ex: Exercise, r: Response): boolean {
  switch (ex.type) {
    case 'mc':
      return r.kind === 'choice' && r.index === ex.answer;
    case 'fill':
    case 'fix':
      return r.kind === 'text' && ex.accepted.some((a) => normalizeAnswer(a) === normalizeAnswer(r.text));
    case 'reorder': {
      if (r.kind !== 'order') return false;
      const built = normalizeAnswer(r.words.join(' '));
      return [ex.words.join(' '), ...(ex.alsoAccepted ?? [])].some((s) => normalizeAnswer(s) === built);
    }
  }
}

/** The right answer as text, for feedback. */
export function rightAnswerText(ex: Exercise): string {
  switch (ex.type) {
    case 'mc':
      return ex.options[ex.answer] ?? '';
    case 'fill':
    case 'fix':
      return ex.accepted[0] ?? '';
    case 'reorder':
      return ex.words.join(' ');
  }
}

/** Deterministic shuffle so the same exercise always shows the same order, never the correct one. */
export function shuffleWords(words: readonly string[], seed: string): string[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  const out = words.map((w, i) => ({ w, i }));
  for (let attempt = 0; attempt < 5; attempt++) {
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [out[i], out[j]] = [out[j] as { w: string; i: number }, out[i] as { w: string; i: number }];
    }
    if (out.some((x, i) => x.i !== i)) break;
  }
  if (out.length > 1 && out.every((x, i) => x.i === i)) out.reverse();
  return out.map((x) => x.w);
}
