// Versioned local storage for all progress. Pure logic plus a thin wrapper
// around a Storage-like backend, so tests can inject fakes.

import { isLocalDate } from './dates';
import { COURSE_IDS, DEFAULT_COURSE_ID, getPlanIn } from './content';
import type {
  CourseProgress,
  DailySession,
  MistakeLogEntry,
  PlacementRecord,
  PlanRecord,
  SelfRating,
  Progress,
  ReviewCard,
  StoredProgress,
  TagId,
  TrackChoice,
  UiLang,
} from './types';

export const STORAGE_KEY = 'english-practice:progress';
export const BACKUP_KEY = 'english-practice:corrupt-backup';
export const CURRENT_VERSION = 3;
export const EXPORT_KIND = 'english-practice-progress';

const TAGS: readonly TagId[] = [
  'ARTICLE', 'BE', 'ORDER', 'SPELLING', 'PB', 'SVA', 'PREPOSITION', 'TENSE', 'PRONOUN', 'UNCOUNTABLE', 'CAPITAL', 'PUNCTUATION', 'WORD',
];

export function defaultCourseProgress(): CourseProgress {
  return {
    track: 'general',
    placement: null,
    placementInProgress: null,
    completedLessons: [],
    completedWriting: [],
    cards: {},
    mistakeLog: [],
    session: null,
    writingDraft: null,
    plan: null,
  };
}

/** The fields that belong to one course. Everything else in Progress is shared by all courses. */
const COURSE_FIELDS = Object.keys(defaultCourseProgress()) as (keyof CourseProgress)[];

export function defaultProgress(): Progress {
  return {
    version: CURRENT_VERSION,
    uiLang: 'ar',
    onboarded: false,
    courseId: DEFAULT_COURSE_ID,
    otherCourses: {},
    track: 'general',
    placement: null,
    placementInProgress: null,
    completedLessons: [],
    completedWriting: [],
    cards: {},
    mistakeLog: [],
    session: null,
    writingDraft: null,
    lastExport: null,
    createdOn: null,
    plan: null,
  };
}

export class InvalidProgressError extends Error {}

/**
 * Limits for progress data. They are far above what real use produces (there are 224 exercises,
 * 32 lessons, 32 writing tasks and 32 placement questions), but stop a damaged or hostile file
 * from filling the browser or slowing the app.
 */
export const LIMITS = {
  /**
   * Largest import file, in characters (about 4 MB). A file at every array limit below is about
   * 2.5 MB; a real export is usually well under 100 KB.
   */
  importChars: 4_000_000,
  /** Courses in one record. */
  courses: 20,
  /** One entry per day, tag and source: about 10 years of daily use. */
  mistakeLog: 20_000,
  cards: 5_000,
  completedLessons: 1_000,
  completedWriting: 1_000,
  placementAnswers: 64,
  planDays: 400,
  planRatings: 400,
  selfCheckItems: 20,
  reviewIds: 50,
  draftChars: 2_000,
} as const;

export interface MigrateOptions {
  /**
   * strict (import): reject data over the limits.
   * Not strict (loading this device's own data): keep the data, but trim the oldest log entries,
   * so a learner never loses everything because of one large list.
   */
  strict?: boolean;
}

function overLimit(rec: Obj): string | null {
  if (isObj(rec.courses)) {
    if (Object.keys(rec.courses).length > LIMITS.courses) return 'courses';
    for (const [id, c] of Object.entries(rec.courses)) {
      const over = isObj(c) ? overLimit(c) : null;
      if (over) return `courses.${id}.${over}`;
    }
    return null;
  }
  const len = (v: unknown) => (Array.isArray(v) ? v.length : 0);
  if (len(rec.mistakeLog) > LIMITS.mistakeLog) return 'mistakeLog';
  if (isObj(rec.cards) && Object.keys(rec.cards).length > LIMITS.cards) return 'cards';
  if (len(rec.completedLessons) > LIMITS.completedLessons) return 'completedLessons';
  if (len(rec.completedWriting) > LIMITS.completedWriting) return 'completedWriting';
  if (isObj(rec.placementInProgress) && len(rec.placementInProgress.answers) > LIMITS.placementAnswers) return 'placementInProgress.answers';
  if (isObj(rec.session) && len(rec.session.reviewIds) > LIMITS.reviewIds) return 'session.reviewIds';
  if (isObj(rec.writingDraft) && typeof rec.writingDraft.text === 'string' && rec.writingDraft.text.length > LIMITS.draftChars) return 'writingDraft';
  if (isObj(rec.plan)) {
    if (len(rec.plan.completedDays) > LIMITS.planDays) return 'plan.completedDays';
    if (len(rec.plan.ratings) > LIMITS.planRatings) return 'plan.ratings';
    if (len(rec.plan.selfCheckStart) > LIMITS.selfCheckItems || len(rec.plan.selfCheckEnd) > LIMITS.selfCheckItems) return 'plan.selfCheck';
  }
  return null;
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isTag = (v: unknown): v is TagId => typeof v === 'string' && (TAGS as readonly string[]).includes(v);
const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

/**
 * Migrations: key N turns a version-N record into version N+1.
 * Version 0 is any record written before versioning existed (no `version` field):
 * it may carry `lang` instead of `uiLang`, and no other known fields.
 */
const MIGRATIONS: Record<number, (old: Obj) => Obj> = {
  0: (old) => {
    const next: Obj = { ...old, version: 1 };
    if (!('uiLang' in old) && (old.lang === 'en' || old.lang === 'ar')) next.uiLang = old.lang;
    delete next.lang;
    return next;
  },
  // Version 2 adds learning plans. Older records simply have no plan yet.
  1: (old) => ({ ...old, version: 2, plan: null }),
  // Version 3 stores progress per course. Everything before it was the English course for Arabic speakers.
  2: (old) => {
    const course: Obj = {};
    for (const k of COURSE_FIELDS) if (k in old) course[k] = old[k];
    return {
      version: 3,
      uiLang: old.uiLang,
      onboarded: old.onboarded,
      lastExport: old.lastExport,
      createdOn: old.createdOn,
      activeCourse: DEFAULT_COURSE_ID,
      courses: { [DEFAULT_COURSE_ID]: course },
    };
  },
};

const isRating = (v: unknown): v is SelfRating => v === 1 || v === 2 || v === 3;

function sanitizePlan(v: unknown, courseId: string): PlanRecord | null {
  if (!isObj(v) || typeof v.planId !== 'string' || !v.planId || !isLocalDate(v.startedOn)) return null;
  // A plan this app does not know cannot be shown, so it is dropped. Days outside the plan are dropped too.
  const known = getPlanIn(courseId, v.planId);
  if (!known) return null;
  const inPlan = (day: unknown) => Number.isInteger(day) && (day as number) >= 1 && (day as number) <= known.days;
  const completedDays = Array.isArray(v.completedDays)
    ? v.completedDays
        .slice(0, LIMITS.planDays)
        .filter((d): d is { day: number; date: string } => isObj(d) && inPlan(d.day) && isLocalDate(d.date))
        .map((d) => ({ day: d.day, date: d.date }))
    : [];
  const ratings = Array.isArray(v.ratings)
    ? v.ratings
        .slice(0, LIMITS.planRatings)
        .filter((r): r is { day: number; rating: SelfRating } => isObj(r) && inPlan(r.day) && isRating(r.rating))
        .map((r) => ({ day: r.day, rating: r.rating }))
    : [];
  const checks = (x: unknown): SelfRating[] | null =>
    Array.isArray(x) && x.length > 0 && x.length <= LIMITS.selfCheckItems && x.every(isRating) ? (x as SelfRating[]) : null;
  const current =
    isObj(v.current) && inPlan(v.current.day) && Number.isInteger(v.current.step) && (v.current.step as number) >= 0
      ? { day: v.current.day as number, step: v.current.step as number }
      : null;
  return {
    planId: v.planId,
    startedOn: v.startedOn,
    completedDays,
    ratings,
    selfCheckStart: checks(v.selfCheckStart),
    selfCheckEnd: checks(v.selfCheckEnd),
    current,
    finishedOn: isLocalDate(v.finishedOn) ? v.finishedOn : null,
  };
}

function sanitizeCard(v: unknown): ReviewCard | null {
  if (!isObj(v)) return null;
  const { id, box, due, lastAnswered, mistakes, learned, created } = v;
  if (typeof id !== 'string' || !id) return null;
  if (typeof box !== 'number' || !Number.isInteger(box) || box < 1 || box > 5) return null;
  if (!isLocalDate(due) || !isLocalDate(created)) return null;
  if (lastAnswered !== null && !isLocalDate(lastAnswered)) return null;
  return {
    id,
    tags: Array.isArray(v.tags) ? v.tags.filter(isTag) : [],
    box,
    due,
    lastAnswered: lastAnswered ?? null,
    mistakes: typeof mistakes === 'number' && mistakes >= 0 ? Math.floor(mistakes) : 0,
    learned: learned === true,
    created,
  };
}

function sanitizeLog(v: unknown): MistakeLogEntry | null {
  if (!isObj(v)) return null;
  const { date, tag, source, count } = v;
  if (!isLocalDate(date) || !isTag(tag)) return null;
  if (source !== 'placement' && source !== 'lesson' && source !== 'review' && source !== 'writing') return null;
  if (typeof count !== 'number' || count < 1) return null;
  return { date, tag, source, count: Math.floor(count) };
}

function sanitizePlacement(v: unknown): PlacementRecord | null {
  if (!isObj(v)) return null;
  const okResult = ['START_A1', 'A1', 'A2', 'B1', 'B2'].includes(v.result as string);
  if (!okResult || !isLocalDate(v.date)) return null;
  return {
    result: v.result as PlacementRecord['result'],
    date: v.date,
    correctByLevel: Array.isArray(v.correctByLevel) ? v.correctByLevel.filter((n): n is number => typeof n === 'number') : [],
    mistakeTags: Array.isArray(v.mistakeTags) ? v.mistakeTags.filter(isTag) : [],
  };
}

function sanitizeSession(v: unknown): DailySession | null {
  if (!isObj(v)) return null;
  const steps = ['review', 'lesson', 'exercises', 'writing', 'done'];
  if (!isLocalDate(v.date) || typeof v.lessonId !== 'string' || !steps.includes(v.step as string)) return null;
  const num = (x: unknown) => (typeof x === 'number' && x >= 0 ? Math.floor(x) : 0);
  return {
    date: v.date,
    lessonId: v.lessonId,
    step: v.step as DailySession['step'],
    reviewIds: strArr(v.reviewIds).slice(0, LIMITS.reviewIds),
    reviewIndex: num(v.reviewIndex),
    exerciseIndex: num(v.exerciseIndex),
    writingTaskId: typeof v.writingTaskId === 'string' ? v.writingTaskId : null,
  };
}

/**
 * Turn any parsed JSON into a valid current-version Progress.
 * Throws InvalidProgressError if it is not a progress record at all,
 * or if it comes from a newer version of the app.
 */
export function migrate(raw: unknown, options: MigrateOptions = {}): Progress {
  if (!isObj(raw)) throw new InvalidProgressError('not an object');
  let rec: Obj = raw;
  let version = typeof rec.version === 'number' ? rec.version : 0;
  if (!Number.isInteger(version) || version < 0) throw new InvalidProgressError('bad version');
  if (version > CURRENT_VERSION) throw new InvalidProgressError('newer version');
  while (version < CURRENT_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) throw new InvalidProgressError(`no migration from ${version}`);
    rec = step(rec);
    version += 1;
  }
  const over = overLimit(rec);
  if (over && options.strict) throw new InvalidProgressError(`limits: ${over}`);

  // Courses this app knows. Progress for a course it does not know cannot be checked, so it is left out.
  const stored = isObj(rec.courses) ? rec.courses : {};
  const courses: Record<string, CourseProgress> = {};
  for (const id of Object.keys(stored).slice(0, LIMITS.courses)) {
    if (COURSE_IDS.includes(id)) courses[id] = sanitizeCourse(stored[id], id);
  }
  const courseId = typeof rec.activeCourse === 'string' && COURSE_IDS.includes(rec.activeCourse) ? rec.activeCourse : DEFAULT_COURSE_ID;
  const { [courseId]: active = defaultCourseProgress(), ...otherCourses } = courses;
  const uiLang: UiLang = rec.uiLang === 'en' ? 'en' : 'ar';

  return {
    ...defaultProgress(),
    version: CURRENT_VERSION,
    uiLang,
    onboarded: rec.onboarded === true,
    lastExport: isLocalDate(rec.lastExport) ? rec.lastExport : null,
    createdOn: isLocalDate(rec.createdOn) ? rec.createdOn : null,
    courseId,
    otherCourses,
    ...active,
  };
}

/** Check and clean the progress of one course. */
function sanitizeCourse(raw: unknown, courseId: string): CourseProgress {
  const rec: Obj = isObj(raw) ? raw : {};
  const cards: Record<string, ReviewCard> = {};
  if (isObj(rec.cards)) {
    for (const value of Object.values(rec.cards).slice(0, LIMITS.cards)) {
      const c = sanitizeCard(value);
      if (c) cards[c.id] = c;
    }
  }
  const track: TrackChoice = rec.track === 'engineers' || rec.track === 'both' ? rec.track : 'general';
  const pip = isObj(rec.placementInProgress) && typeof rec.placementInProgress.index === 'number' && Array.isArray(rec.placementInProgress.answers)
    ? {
        index: Math.max(0, Math.floor(rec.placementInProgress.index)),
        answers: rec.placementInProgress.answers.slice(0, LIMITS.placementAnswers).map((a) => (typeof a === 'number' ? a : null)),
      }
    : null;
  const draft = isObj(rec.writingDraft) && typeof rec.writingDraft.taskId === 'string' && typeof rec.writingDraft.text === 'string'
    ? { taskId: rec.writingDraft.taskId, text: rec.writingDraft.text.slice(0, LIMITS.draftChars) }
    : null;

  return {
    track,
    placement: sanitizePlacement(rec.placement),
    placementInProgress: pip,
    completedLessons: strArr(rec.completedLessons).slice(0, LIMITS.completedLessons),
    completedWriting: strArr(rec.completedWriting).slice(0, LIMITS.completedWriting),
    cards,
    // Keep the newest entries if the log is too long.
    mistakeLog: Array.isArray(rec.mistakeLog) ? rec.mistakeLog.slice(-LIMITS.mistakeLog).map(sanitizeLog).filter((x): x is MistakeLogEntry => x !== null) : [],
    session: sanitizeSession(rec.session),
    writingDraft: draft,
    plan: sanitizePlan(rec.plan, courseId),
  };
}

/** The per-course record that is saved on the device and in exports. */
export function toStored(p: Progress): StoredProgress {
  const active = {} as Record<string, unknown>;
  for (const k of COURSE_FIELDS) active[k] = p[k];
  return {
    version: CURRENT_VERSION,
    uiLang: p.uiLang,
    onboarded: p.onboarded,
    lastExport: p.lastExport,
    createdOn: p.createdOn,
    activeCourse: p.courseId,
    courses: { ...p.otherCourses, [p.courseId]: active as unknown as CourseProgress },
  };
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type StoreStatus = 'ok' | 'unavailable' | 'full' | 'recovered';

export interface LoadResult {
  progress: Progress;
  status: StoreStatus;
}

/** Find a usable storage backend, or null. Never throws. */
export function detectStorage(): StorageLike | null {
  try {
    const s = globalThis.localStorage;
    if (!s) return null;
    const k = '__ep_test__';
    s.setItem(k, '1');
    s.removeItem(k);
    return s;
  } catch {
    return null;
  }
}

export function loadProgress(backend: StorageLike | null): LoadResult {
  if (!backend) return { progress: defaultProgress(), status: 'unavailable' };
  let raw: string | null;
  try {
    raw = backend.getItem(STORAGE_KEY);
  } catch {
    return { progress: defaultProgress(), status: 'unavailable' };
  }
  if (raw === null) return { progress: defaultProgress(), status: 'ok' };
  try {
    return { progress: migrate(JSON.parse(raw)), status: 'ok' };
  } catch {
    // Keep a copy of what we could not read, then start fresh.
    try {
      backend.setItem(BACKUP_KEY, raw);
    } catch {
      /* ignore */
    }
    return { progress: defaultProgress(), status: 'recovered' };
  }
}

export function saveProgress(backend: StorageLike | null, p: Progress): StoreStatus {
  if (!backend) return 'unavailable';
  try {
    backend.setItem(STORAGE_KEY, JSON.stringify(toStored(p)));
    return 'ok';
  } catch (e) {
    const name = e instanceof Error ? e.name : '';
    return name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED' ? 'full' : 'unavailable';
  }
}

/** Delete every key this app owns. */
export function deleteAllProgress(backend: StorageLike | null): boolean {
  if (!backend) return false;
  try {
    backend.removeItem(STORAGE_KEY);
    backend.removeItem(BACKUP_KEY);
    return true;
  } catch {
    return false;
  }
}

export interface ExportFile {
  kind: typeof EXPORT_KIND;
  exportedOn: string;
  progress: StoredProgress;
}

export function exportProgress(p: Progress, exportedOn: string): string {
  // Drafts of the learner's writing are not exported.
  const noDrafts: Record<string, CourseProgress> = {};
  for (const [id, c] of Object.entries(p.otherCourses)) noDrafts[id] = { ...c, writingDraft: null };
  const file: ExportFile = { kind: EXPORT_KIND, exportedOn, progress: toStored({ ...p, writingDraft: null, otherCourses: noDrafts }) };
  return JSON.stringify(file, null, 2);
}

/** Something in an import file was damaged and left out, although the rest loaded. */
export type ImportWarning = 'planDropped' | 'courseDropped';

export type ImportResult = { ok: true; progress: Progress; warnings: ImportWarning[] } | { ok: false; reason: 'json' | 'kind' | 'invalid' | 'newer' | 'tooLarge' | 'tooMany' };

export function importProgress(text: string): ImportResult {
  if (text.length > LIMITS.importChars) return { ok: false, reason: 'tooLarge' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'json' };
  }
  if (!isObj(parsed) || parsed.kind !== EXPORT_KIND || !isObj(parsed.progress)) return { ok: false, reason: 'kind' };
  try {
    const progress = migrate(parsed.progress, { strict: true });
    const warnings: ImportWarning[] = [];
    // Before version 3 the plan was at the top level; from version 3 it is inside each course.
    const raw = parsed.progress;
    const rawCourses = isObj(raw.courses) ? raw.courses : null;
    const rawActive = rawCourses ? rawCourses[progress.courseId] : raw;
    const rawPlan = isObj(rawActive) ? rawActive.plan : undefined;
    if (rawPlan !== undefined && rawPlan !== null && progress.plan === null) warnings.push('planDropped');
    if (rawCourses && Object.keys(rawCourses).some((id) => !COURSE_IDS.includes(id))) warnings.push('courseDropped');
    return { ok: true, progress, warnings };
  } catch (e) {
    if (e instanceof InvalidProgressError && e.message === 'newer version') return { ok: false, reason: 'newer' };
    if (e instanceof InvalidProgressError && e.message.startsWith('limits')) return { ok: false, reason: 'tooMany' };
    return { ok: false, reason: 'invalid' };
  }
}

/** Ask the browser to keep our data. Safe to call anywhere. */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage && typeof navigator.storage.persist === 'function') {
      return await navigator.storage.persist();
    }
  } catch {
    /* ignore */
  }
  return false;
}
