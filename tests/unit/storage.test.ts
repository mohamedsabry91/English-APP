import { describe, expect, it } from 'vitest';
import {
  BACKUP_KEY,
  CURRENT_VERSION,
  STORAGE_KEY,
  defaultProgress,
  deleteAllProgress,
  exportProgress,
  importProgress,
  LIMITS,
  loadProgress,
  migrate,
  saveProgress,
  type StorageLike,
} from '../../src/core/storage';

class MemoryStorage implements StorageLike {
  map = new Map<string, string>();
  getItem(k: string) {
    return this.map.has(k) ? (this.map.get(k) as string) : null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
}

class ThrowingStorage implements StorageLike {
  getItem(): string | null {
    throw new Error('SecurityError');
  }
  setItem(): void {
    throw new Error('SecurityError');
  }
  removeItem(): void {
    throw new Error('SecurityError');
  }
}

class FullStorage extends MemoryStorage {
  override setItem(): void {
    const e = new Error('full');
    e.name = 'QuotaExceededError';
    throw e;
  }
}

function sample() {
  const p = defaultProgress();
  p.uiLang = 'en';
  p.onboarded = true;
  p.track = 'both';
  p.placement = { result: 'B1', date: '2026-11-01', correctByLevel: [8, 7, 6, 3], mistakeTags: ['ARTICLE'] };
  p.cards['g-a1-01-e1'] = { id: 'g-a1-01-e1', tags: ['BE'], box: 2, due: '2026-11-05', lastAnswered: '2026-11-02', mistakes: 1, learned: false, created: '2026-11-01' };
  p.mistakeLog.push({ date: '2026-11-01', tag: 'BE', source: 'lesson', count: 2 });
  p.completedLessons.push('g-a1-01');
  p.writingDraft = { taskId: 'w-1', text: 'my private draft' };
  return p;
}

describe('migration', () => {
  it('migrates an unversioned (v0) record and fills defaults', () => {
    const p = migrate({ lang: 'en', onboarded: true });
    expect(p.version).toBe(CURRENT_VERSION);
    expect(p.uiLang).toBe('en');
    expect(p.onboarded).toBe(true);
    expect(p.cards).toEqual({});
    expect(p.track).toBe('general');
  });

  it('keeps a valid current record unchanged', () => {
    const p = sample();
    expect(migrate(JSON.parse(JSON.stringify(p)))).toEqual(p);
  });

  it('drops invalid cards and log entries but keeps the rest', () => {
    const p = migrate({
      version: 1,
      cards: { a: { id: 'a', box: 9, due: '2026-01-01', created: '2026-01-01', lastAnswered: null }, b: 'x' },
      mistakeLog: [{ date: 'yesterday', tag: 'BE', source: 'lesson', count: 1 }, { date: '2026-01-01', tag: 'NOPE', source: 'lesson', count: 1 }],
      completedLessons: ['x', 3],
    });
    expect(p.cards).toEqual({});
    expect(p.mistakeLog).toEqual([]);
    expect(p.completedLessons).toEqual(['x']);
  });

  it('rejects data from a newer version and non-objects', () => {
    expect(() => migrate({ version: CURRENT_VERSION + 1 })).toThrow();
    expect(() => migrate('hello')).toThrow();
    expect(() => migrate([1, 2])).toThrow();
    expect(() => migrate(null)).toThrow();
  });
});

describe('load and save', () => {
  it('returns defaults when nothing is stored', () => {
    const r = loadProgress(new MemoryStorage());
    expect(r.status).toBe('ok');
    expect(r.progress).toEqual(defaultProgress());
  });

  it('saves and loads back the same record', () => {
    const s = new MemoryStorage();
    expect(saveProgress(s, sample())).toBe('ok');
    expect(loadProgress(s).progress).toEqual(sample());
  });

  it('recovers from corrupt data and keeps a backup copy', () => {
    const s = new MemoryStorage();
    s.setItem(STORAGE_KEY, '{not json');
    const r = loadProgress(s);
    expect(r.status).toBe('recovered');
    expect(r.progress).toEqual(defaultProgress());
    expect(s.getItem(BACKUP_KEY)).toBe('{not json');
  });

  it('treats a stored record from a newer version as corrupt, without losing it', () => {
    const s = new MemoryStorage();
    s.setItem(STORAGE_KEY, JSON.stringify({ version: 99 }));
    expect(loadProgress(s).status).toBe('recovered');
    expect(s.getItem(BACKUP_KEY)).toContain('99');
  });

  it('runs with no storage at all', () => {
    expect(loadProgress(null).status).toBe('unavailable');
    expect(saveProgress(null, sample())).toBe('unavailable');
    expect(deleteAllProgress(null)).toBe(false);
  });

  it('runs when storage throws on every call', () => {
    const s = new ThrowingStorage();
    const r = loadProgress(s);
    expect(r.status).toBe('unavailable');
    expect(r.progress).toEqual(defaultProgress());
    expect(saveProgress(s, sample())).toBe('unavailable');
    expect(deleteAllProgress(s)).toBe(false);
  });

  it('reports a full storage', () => {
    expect(saveProgress(new FullStorage(), sample())).toBe('full');
  });
});

describe('export and import', () => {
  it('round-trips progress, without the writing draft', () => {
    const p = sample();
    const text = exportProgress(p, '2026-11-02');
    expect(text).not.toContain('my private draft');
    const r = importProgress(text);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.progress).toEqual({ ...p, writingDraft: null });
  });

  it('rejects bad files with a reason', () => {
    expect(importProgress('nope')).toEqual({ ok: false, reason: 'json' });
    expect(importProgress('{"a":1}')).toEqual({ ok: false, reason: 'kind' });
    expect(importProgress(JSON.stringify({ kind: 'english-practice-progress', progress: { version: 50 } }))).toEqual({ ok: false, reason: 'newer' });
  });
});

describe('delete all', () => {
  it('removes every key the app owns', () => {
    const s = new MemoryStorage();
    saveProgress(s, sample());
    s.setItem(BACKUP_KEY, 'x');
    s.setItem('other-app', 'keep');
    expect(deleteAllProgress(s)).toBe(true);
    expect(s.getItem(STORAGE_KEY)).toBeNull();
    expect(s.getItem(BACKUP_KEY)).toBeNull();
    expect(s.getItem('other-app')).toBe('keep');
    expect(loadProgress(s).progress).toEqual(defaultProgress());
  });
});

describe('import limits', () => {
  const wrap = (progress: unknown) => JSON.stringify({ kind: 'english-practice-progress', exportedOn: '2026-11-02', progress });
  const log = (n: number) => Array.from({ length: n }, (_, i) => ({ date: '2026-11-01', tag: 'BE', source: 'lesson', count: i + 1 }));
  const cards = (n: number) =>
    Object.fromEntries(Array.from({ length: n }, (_, i) => [`c${i}`, { id: `c${i}`, tags: ['BE'], box: 1, due: '2026-11-03', lastAnswered: null, mistakes: 1, learned: false, created: '2026-11-01' }]));
  const ids = (n: number) => Array.from({ length: n }, (_, i) => `l${i}`);

  it('still imports a normal export', () => {
    const r = importProgress(exportProgress(sample(), '2026-11-02'));
    expect(r.ok).toBe(true);
  });

  it('imports data exactly at every limit', () => {
    const p = {
      ...defaultProgress(),
      mistakeLog: log(LIMITS.mistakeLog),
      cards: cards(LIMITS.cards),
      completedLessons: ids(LIMITS.completedLessons),
      placementInProgress: { index: 0, answers: Array.from({ length: LIMITS.placementAnswers }, () => 0) },
    };
    const text = wrap(p);
    expect(text.length).toBeLessThan(LIMITS.importChars);
    const r = importProgress(text);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.progress.mistakeLog).toHaveLength(LIMITS.mistakeLog);
      expect(Object.keys(r.progress.cards)).toHaveLength(LIMITS.cards);
    }
  });

  it('rejects a file that is too large, before parsing it', () => {
    const big = wrap({ ...defaultProgress(), note: 'x'.repeat(LIMITS.importChars) });
    expect(importProgress(big)).toEqual({ ok: false, reason: 'tooLarge' });
    expect(importProgress(' '.repeat(LIMITS.importChars + 1))).toEqual({ ok: false, reason: 'tooLarge' });
  });

  it.each([
    ['mistakeLog', { mistakeLog: log(LIMITS.mistakeLog + 1) }],
    ['cards', { cards: cards(LIMITS.cards + 1) }],
    ['completedLessons', { completedLessons: ids(LIMITS.completedLessons + 1) }],
    ['completedWriting', { completedWriting: ids(LIMITS.completedWriting + 1) }],
    ['placementInProgress.answers', { placementInProgress: { index: 0, answers: Array.from({ length: LIMITS.placementAnswers + 1 }, () => 0) } }],
  ])('rejects a file with too many %s', (_name, extra) => {
    expect(importProgress(wrap({ ...defaultProgress(), ...extra }))).toEqual({ ok: false, reason: 'tooMany' });
  });

  it('does not throw away this device\'s own data that is over a limit; it keeps the newest log entries', () => {
    const s = new MemoryStorage();
    s.setItem(STORAGE_KEY, JSON.stringify({ ...sample(), mistakeLog: log(LIMITS.mistakeLog + 10), completedLessons: ids(LIMITS.completedLessons + 5) }));
    const r = loadProgress(s);
    expect(r.status).toBe('ok');
    expect(r.progress.mistakeLog).toHaveLength(LIMITS.mistakeLog);
    expect(r.progress.mistakeLog[r.progress.mistakeLog.length - 1]?.count).toBe(LIMITS.mistakeLog + 10);
    expect(r.progress.completedLessons).toHaveLength(LIMITS.completedLessons);
    expect(r.progress.onboarded).toBe(true);
  });

  it('shortens a stored draft that is over the length limit', () => {
    const p = migrate({ version: 1, writingDraft: { taskId: 'w', text: 'a'.repeat(LIMITS.draftChars + 50) } });
    expect(p.writingDraft?.text).toHaveLength(LIMITS.draftChars);
  });
});

describe('version 2: learning plans', () => {
  const plan = {
    planId: '15-day-start',
    startedOn: '2026-11-01',
    completedDays: [{ day: 1, date: '2026-11-01' }, { day: 2, date: '2026-11-02' }],
    ratings: [{ day: 1, rating: 2 }, { day: 2, rating: 3 }],
    selfCheckStart: [1, 1, 2, 1, 2],
    selfCheckEnd: null,
    current: { day: 3, step: 1 },
    finishedOn: null,
  };

  it('migrates a version 1 record to version 2 with no plan, keeping everything else', () => {
    const v1 = { ...sample(), version: 1 } as Record<string, unknown>;
    delete v1.plan;
    const p = migrate(v1);
    expect(p.version).toBe(2);
    expect(p.plan).toBeNull();
    expect(p.cards).toEqual(sample().cards);
    expect(p.mistakeLog).toEqual(sample().mistakeLog);
  });

  it('migrates an unversioned record all the way to version 2', () => {
    expect(migrate({ lang: 'en' })).toMatchObject({ version: 2, uiLang: 'en', plan: null });
  });

  it('keeps a valid plan record', () => {
    const p = migrate({ ...sample(), plan });
    expect(p.plan).toEqual(plan);
  });

  it('drops a damaged plan, and invalid entries inside a plan', () => {
    expect(migrate({ ...sample(), plan: { planId: '', startedOn: 'x' } }).plan).toBeNull();
    const p = migrate({
      ...sample(),
      plan: { ...plan, completedDays: [{ day: 0, date: '2026-11-01' }, { day: 1, date: 'bad' }, { day: 2, date: '2026-11-02' }], ratings: [{ day: 1, rating: 5 }], selfCheckStart: [1, 4], current: { day: -1, step: 0 } },
    }).plan;
    expect(p?.completedDays).toEqual([{ day: 2, date: '2026-11-02' }]);
    expect(p?.ratings).toEqual([]);
    expect(p?.selfCheckStart).toBeNull();
    expect(p?.current).toBeNull();
  });

  it('exports and imports the plan, and a version 1 export still imports', () => {
    const withPlan = { ...sample(), plan };
    const r = importProgress(exportProgress(migrate(withPlan), '2026-11-03'));
    expect(r.ok && r.progress.plan).toEqual(plan);
    const v1File = JSON.stringify({ kind: 'english-practice-progress', exportedOn: '2026-11-01', progress: { ...sample(), version: 1, plan: undefined } });
    const r1 = importProgress(v1File);
    expect(r1.ok).toBe(true);
    if (r1.ok) expect(r1.progress).toMatchObject({ version: 2, plan: null, completedLessons: ['g-a1-01'] });
  });

  it('rejects an import with too many plan entries', () => {
    const many = { ...plan, completedDays: Array.from({ length: LIMITS.planDays + 1 }, (_, i) => ({ day: i + 1, date: '2026-11-01' })) };
    const text = JSON.stringify({ kind: 'english-practice-progress', exportedOn: '2026-11-03', progress: { ...sample(), plan: many } });
    expect(importProgress(text)).toEqual({ ok: false, reason: 'tooMany' });
  });
});

describe('damaged plan data', () => {
  const base = { planId: '15-day-start', startedOn: '2026-11-01', completedDays: [{ day: 1, date: '2026-11-01' }], ratings: [], selfCheckStart: null, selfCheckEnd: null, finishedOn: null };

  it('drops a day in progress that is outside the plan, and keeps the rest', () => {
    const p = migrate({ ...sample(), plan: { ...base, current: { day: 99, step: 3 } } });
    expect(p.plan?.current).toBeNull();
    expect(p.plan?.completedDays).toEqual([{ day: 1, date: '2026-11-01' }]);
    expect(p.completedLessons).toEqual(['g-a1-01']);
  });

  it('drops days and ratings outside the plan', () => {
    const p = migrate({ ...sample(), plan: { ...base, completedDays: [{ day: 16, date: '2026-11-02' }, { day: 1, date: '2026-11-01' }], ratings: [{ day: 40, rating: 2 }], current: { day: 15, step: 0 } } });
    expect(p.plan?.completedDays).toEqual([{ day: 1, date: '2026-11-01' }]);
    expect(p.plan?.ratings).toEqual([]);
    expect(p.plan?.current).toEqual({ day: 15, step: 0 });
  });

  it('drops a plan this app does not know', () => {
    expect(migrate({ ...sample(), plan: { ...base, planId: 'no-such-plan', current: null } }).plan).toBeNull();
  });
});

describe('import warns when plan data is dropped', () => {
  const file = (plan: unknown) => JSON.stringify({ kind: 'english-practice-progress', exportedOn: '2026-11-03', progress: { ...sample(), plan } });

  it('loads the rest and warns when the plan has an invalid start date', () => {
    const r = importProgress(file({ planId: '15-day-start', startedOn: 'not a date', completedDays: [] }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.progress.plan).toBeNull();
      expect(r.progress.completedLessons).toEqual(['g-a1-01']);
      expect(r.warnings).toEqual(['planDropped']);
    }
  });

  it('gives no warning when there is no plan or the plan is valid', () => {
    const none = importProgress(file(null));
    expect(none.ok && none.warnings).toEqual([]);
    const ok = importProgress(file({ planId: '15-day-start', startedOn: '2026-11-01', completedDays: [], ratings: [], selfCheckStart: null, selfCheckEnd: null, current: null, finishedOn: null }));
    expect(ok.ok && ok.warnings).toEqual([]);
  });
});
