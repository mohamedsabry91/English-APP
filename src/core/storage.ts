// Versioned local storage for all progress. Pure logic plus a thin wrapper
// around a Storage-like backend, so tests can inject fakes.

import { isLocalDate } from './dates';
import type {
  DailySession,
  MistakeLogEntry,
  PlacementRecord,
  Progress,
  ReviewCard,
  TagId,
  TrackChoice,
  UiLang,
} from './types';

export const STORAGE_KEY = 'english-practice:progress';
export const BACKUP_KEY = 'english-practice:corrupt-backup';
export const CURRENT_VERSION = 1;
export const EXPORT_KIND = 'english-practice-progress';

const TAGS: readonly TagId[] = [
  'ARTICLE', 'BE', 'ORDER', 'SPELLING', 'PB', 'SVA', 'PREPOSITION', 'TENSE', 'PRONOUN', 'UNCOUNTABLE', 'CAPITAL', 'PUNCTUATION',
];

export function defaultProgress(): Progress {
  return {
    version: CURRENT_VERSION,
    uiLang: 'ar',
    onboarded: false,
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
  };
}

export class InvalidProgressError extends Error {}

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
};

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
    reviewIds: strArr(v.reviewIds),
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
export function migrate(raw: unknown): Progress {
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

  const d = defaultProgress();
  const cards: Record<string, ReviewCard> = {};
  if (isObj(rec.cards)) {
    for (const value of Object.values(rec.cards)) {
      const c = sanitizeCard(value);
      if (c) cards[c.id] = c;
    }
  }
  const track: TrackChoice = rec.track === 'engineers' || rec.track === 'both' ? rec.track : 'general';
  const uiLang: UiLang = rec.uiLang === 'en' ? 'en' : 'ar';
  const pip = isObj(rec.placementInProgress) && typeof rec.placementInProgress.index === 'number' && Array.isArray(rec.placementInProgress.answers)
    ? {
        index: Math.max(0, Math.floor(rec.placementInProgress.index)),
        answers: rec.placementInProgress.answers.map((a) => (typeof a === 'number' ? a : null)),
      }
    : null;
  const draft = isObj(rec.writingDraft) && typeof rec.writingDraft.taskId === 'string' && typeof rec.writingDraft.text === 'string'
    ? { taskId: rec.writingDraft.taskId, text: rec.writingDraft.text }
    : null;

  return {
    ...d,
    version: CURRENT_VERSION,
    uiLang,
    onboarded: rec.onboarded === true,
    track,
    placement: sanitizePlacement(rec.placement),
    placementInProgress: pip,
    completedLessons: strArr(rec.completedLessons),
    completedWriting: strArr(rec.completedWriting),
    cards,
    mistakeLog: Array.isArray(rec.mistakeLog) ? rec.mistakeLog.map(sanitizeLog).filter((x): x is MistakeLogEntry => x !== null) : [],
    session: sanitizeSession(rec.session),
    writingDraft: draft,
    lastExport: isLocalDate(rec.lastExport) ? rec.lastExport : null,
    createdOn: isLocalDate(rec.createdOn) ? rec.createdOn : null,
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
    backend.setItem(STORAGE_KEY, JSON.stringify(p));
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
  progress: Progress;
}

export function exportProgress(p: Progress, exportedOn: string): string {
  // Drafts of the learner's writing are not exported.
  const file: ExportFile = { kind: EXPORT_KIND, exportedOn, progress: { ...p, writingDraft: null } };
  return JSON.stringify(file, null, 2);
}

export type ImportResult = { ok: true; progress: Progress } | { ok: false; reason: 'json' | 'kind' | 'invalid' | 'newer' };

export function importProgress(text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'json' };
  }
  if (!isObj(parsed) || parsed.kind !== EXPORT_KIND || !isObj(parsed.progress)) return { ok: false, reason: 'kind' };
  try {
    return { ok: true, progress: migrate(parsed.progress) };
  } catch (e) {
    if (e instanceof InvalidProgressError && e.message === 'newer version') return { ok: false, reason: 'newer' };
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
