import type { Level, TagId, TrackId } from './types';

export interface TagInfo {
  id: TagId;
  nameEn: string;
  nameAr: string;
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
  /** Arabic explanation of the right answer. */
  explanationAr: string;
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
  ar: string;
}

export interface Comparison {
  ar: string;
  en: string;
  noteAr: string;
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
  selfCheckAr: string[];
  lessonId?: string;
  reviewed: boolean;
}
