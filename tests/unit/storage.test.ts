import { describe, expect, it } from 'vitest';
import {
  BACKUP_KEY,
  CURRENT_VERSION,
  STORAGE_KEY,
  defaultProgress,
  deleteAllProgress,
  exportProgress,
  importProgress,
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
