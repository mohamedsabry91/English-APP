// Placement test scoring. Pure functions.
import { LEVELS, type Level, type PlacementResult } from './types';

export const QUESTIONS_PER_LEVEL = 8;
export const PASS_MARK = 6;
export const EARLY_STOP_MAX = 4;

export function levelPassed(correct: number): boolean {
  return correct >= PASS_MARK;
}

/** Stop after a finished level with 4 or fewer correct out of 8. */
export function shouldStopAfterLevel(correct: number): boolean {
  return correct <= EARLY_STOP_MAX;
}

/**
 * correctByLevel[i] = number correct in LEVELS[i]. Levels not taken may be missing.
 * Result: the highest level passed with every lower level also passed; else START_A1.
 */
export function scorePlacement(correctByLevel: readonly number[]): PlacementResult {
  let result: PlacementResult = 'START_A1';
  for (let i = 0; i < LEVELS.length; i++) {
    const c = correctByLevel[i];
    if (c === undefined || !levelPassed(c)) break;
    result = LEVELS[i] as Level;
  }
  return result;
}

/** Where lessons start: the level after the one passed (B2 stays at B2). */
export function startLevel(result: PlacementResult): Level {
  switch (result) {
    case 'START_A1':
      return 'A1';
    case 'A1':
      return 'A2';
    case 'A2':
      return 'B1';
    case 'B1':
    case 'B2':
      return 'B2';
  }
}

export interface PlacementQuestionLike {
  level: Level;
  answer: number;
}

/**
 * Walk the answers in order and work out correct counts per level, whether the test has
 * stopped (early or at the end), and the index of the next question.
 */
export function placementState(questions: readonly PlacementQuestionLike[], answers: readonly (number | null)[]) {
  const correctByLevel: number[] = [];
  let next = 0;
  let finished = false;
  for (let li = 0; li < LEVELS.length; li++) {
    const level = LEVELS[li];
    const qs = questions.map((q, i) => ({ q, i })).filter(({ q }) => q.level === level);
    let correct = 0;
    let complete = true;
    for (const { q, i } of qs) {
      const a = answers[i];
      if (a === null || a === undefined) {
        complete = false;
        next = i;
        break;
      }
      if (a === q.answer) correct++;
    }
    if (!complete) return { correctByLevel, finished: false, next };
    correctByLevel.push(correct);
    if (shouldStopAfterLevel(correct)) {
      finished = true;
      break;
    }
  }
  if (correctByLevel.length === LEVELS.length) finished = true;
  return { correctByLevel, finished, next: finished ? -1 : next };
}
