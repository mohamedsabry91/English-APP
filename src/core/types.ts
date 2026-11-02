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
}
