// Shared data types. No React in core/.

export type UiLang = 'ar' | 'en';
export type Level = 'A1' | 'A2' | 'B1' | 'B2';
export const LEVELS: readonly Level[] = ['A1', 'A2', 'B1', 'B2'];
export type PlacementResult = 'START_A1' | Level;
export type TrackId = 'general' | 'engineers';
export type TrackChoice = TrackId | 'both';

export type TagId =
  | 'ARTICLE'
  | 'BE'
  | 'ORDER'
  | 'SPELLING'
  | 'PB'
  | 'SVA'
  | 'PREPOSITION'
  | 'TENSE'
  | 'PRONOUN'
  | 'UNCOUNTABLE'
  | 'CAPITAL'
  | 'PUNCTUATION'
  | 'WORD';

/** A date in the learner's local calendar, as YYYY-MM-DD. */
export type LocalDate = string;

export type MistakeSource = 'placement' | 'lesson' | 'review' | 'writing';

export interface MistakeLogEntry {
  date: LocalDate;
  tag: TagId;
  source: MistakeSource;
  count: number;
}

export interface ReviewCard {
  /** Same as the exercise id. */
  id: string;
  tags: TagId[];
  /** 1 to 5 */
  box: number;
  due: LocalDate;
  lastAnswered: LocalDate | null;
  mistakes: number;
  learned: boolean;
  created: LocalDate;
}

export type SessionStep = 'review' | 'lesson' | 'exercises' | 'writing' | 'done';

export interface DailySession {
  date: LocalDate;
  lessonId: string;
  step: SessionStep;
  reviewIds: string[];
  reviewIndex: number;
  exerciseIndex: number;
  writingTaskId: string | null;
}

export interface PlacementRecord {
  result: PlacementResult;
  date: LocalDate;
  correctByLevel: number[];
  mistakeTags: TagId[];
}

export interface PlacementProgress {
  index: number;
  answers: (number | null)[];
}

/** Self-rating after a "say it aloud" prompt: 1 = needed the sample, 2 = with pauses, 3 = clearly. */
export type SelfRating = 1 | 2 | 3;

/** Progress in a learning plan such as "15-Day Start". Kept on the device and included in exports. */
export interface PlanRecord {
  planId: string;
  startedOn: LocalDate;
  /** Plan days finished, with the local date each one was finished. */
  completedDays: { day: number; date: LocalDate }[];
  /** "Say it aloud" self-ratings, one per plan day at most. */
  ratings: { day: number; rating: SelfRating }[];
  /** The same short self-check on the first and last day (one answer of 1 to 3 per statement). */
  selfCheckStart: SelfRating[] | null;
  selfCheckEnd: SelfRating[] | null;
  /** The plan day in progress and the step reached, so the learner can resume. */
  current: { day: number; step: number } | null;
  finishedOn: LocalDate | null;
}

export interface Progress {
  version: number;
  uiLang: UiLang;
  onboarded: boolean;
  track: TrackChoice;
  placement: PlacementRecord | null;
  placementInProgress: PlacementProgress | null;
  completedLessons: string[];
  completedWriting: string[];
  cards: Record<string, ReviewCard>;
  mistakeLog: MistakeLogEntry[];
  session: DailySession | null;
  writingDraft: { taskId: string; text: string } | null;
  lastExport: LocalDate | null;
  createdOn: LocalDate | null;
  plan: PlanRecord | null;
}
