import type { Level, TagId, TrackId } from './types';

export interface TagInfo {
  id: TagId;
  nameEn: string;
  nameAr: string;
  /**
   * Optional note for speakers of the learner's language: why this mistake may happen
   * ("you may say X because Arabic does Y"). Each course has its own, or none.
   */
  hint?: { en?: string; ar?: string; reviewed: boolean };
}

export interface PlacementQuestion {
  id: string;
  level: Level;
  tag: TagId | null;
  prompt: string;
  options: string[];
  answer: number;
}

interface ExerciseBase {
  id: string;
  tags: TagId[];
  /** Explanation of the right answer, in simple English. Content without it still has the Arabic one (being replaced). */
  explanationEn?: string;
  explanationAr?: string;
}

export interface McExercise extends ExerciseBase {
  type: 'mc';
  prompt: string;
  options: string[];
  answer: number;
}

/** Typed answer. `prompt` contains ___ for the gap. */
export interface FillExercise extends ExerciseBase {
  type: 'fill';
  prompt: string;
  accepted: string[];
}

/** `words` are in the correct order; the app shuffles them. */
export interface ReorderExercise extends ExerciseBase {
  type: 'reorder';
  words: string[];
  /** Other full sentences that are also correct. */
  alsoAccepted?: string[];
}

/** Find and fix the mistake: `sentence` has one mistake, `accepted` are corrected full sentences. */
export interface FixExercise extends ExerciseBase {
  type: 'fix';
  sentence: string;
  accepted: string[];
}

export type Exercise = McExercise | FillExercise | ReorderExercise | FixExercise;

export interface Example {
  en: string;
  ar?: string;
}

/**
 * A common mistake and the right English. `wrong` and `noteEn` are the English-only form;
 * `ar` and `noteAr` are the older Arabic-to-English form, being replaced.
 */
export interface Comparison {
  en: string;
  wrong?: string;
  noteEn?: string;
  ar?: string;
  noteAr?: string;
}

export interface Lesson {
  id: string;
  track: TrackId;
  level: Level;
  order: number;
  titleEn: string;
  titleAr: string;
  tags: TagId[];
  explanationAr: string;
  explanationEn: string;
  comparison: Comparison[];
  examples: Example[];
  exercises: Exercise[];
  writingTaskId: string;
  reviewed: boolean;
}

export interface WritingTask {
  id: string;
  track: TrackId;
  level: Level;
  titleEn: string;
  titleAr: string;
  promptEn: string;
  promptAr: string;
  wordLimit: number;
  modelAnswer: string;
  selfCheckEn?: string[];
  selfCheckAr?: string[];
  lessonId?: string;
  reviewed: boolean;
}

/** A whole work phrase, learned as a card in spaced review. */
export interface Phrase {
  id: string;
  en: string;
  /** When you use the phrase, in simple English: the learner reads this and recalls the phrase. */
  cueEn?: string;
  /** A short usage note in simple English. */
  noteEn?: string;
  ar?: string;
  noteAr?: string;
}

export interface StoryQuestion {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanationEn?: string;
  explanationAr?: string;
}

/** A short work story: 4 lines, 3 quick questions, and a retelling from another person's view. */
export interface Story {
  id: string;
  titleEn: string;
  titleAr: string;
  lines: { en: string; ar?: string }[];
  questions: StoryQuestion[];
  retell: { promptEn: string; promptAr: string; sample: string };
}

/** "Say it aloud": the app shows a prompt and a sample. It cannot hear or check speech. */
export interface SayPrompt {
  id: string;
  promptEn: string;
  promptAr: string;
  sample: string;
}

export type PlanDay =
  | { day: number; type: 'learn'; phrases: string[]; storyId: string; sayId: string }
  | { day: number; type: 'review'; phrases: string[]; writingTaskId: string; sayId: string };

/** A learning plan, loaded from content/<course>/plans/*.json. */
export interface Plan {
  id: string;
  reviewed: boolean;
  /** Only available plans are shown in the picker. */
  available: boolean;
  order: number;
  days: number;
  minutesPerDay: number;
  titleEn: string;
  titleAr: string;
  summaryEn: string;
  summaryAr: string;
  honestAr: string;
  honestEn: string;
  howItWorksAr: string;
  howItWorksEn: string;
  routine: { minutes: number; ar: string; en: string }[];
  goals: { id: 'phrases' | 'messages' | 'intro' | 'days'; ar: string; en: string }[];
  selfCheck: { ar: string; en: string }[];
  canDoAr: string[];
  canDoEn: string[];
  cannotYetAr: string[];
  cannotYetEn: string[];
  schedule: PlanDay[];
}
