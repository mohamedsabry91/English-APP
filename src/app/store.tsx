import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { toLocalDate } from '../core/dates';
import {
  defaultProgress,
  deleteAllProgress,
  detectStorage,
  loadProgress,
  requestPersistence,
  saveProgress,
  type StorageLike,
  type StoreStatus,
} from '../core/storage';
import type { LocalDate, Progress, UiLang } from '../core/types';
import { translate, type MsgKey } from '../i18n';

interface StoreValue {
  progress: Progress;
  status: StoreStatus;
  lang: UiLang;
  t: (key: MsgKey, vars?: Record<string, string | number>) => string;
  update: (fn: (p: Progress) => Progress) => void;
  replace: (p: Progress) => void;
  deleteAll: () => void;
  /** The learner's local date, read from the clock in the UI layer only. */
  today: () => LocalDate;
}

const Ctx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const backendRef = useRef<StorageLike | null>(null);
  const [state, setState] = useState(() => {
    const backend = detectStorage();
    backendRef.current = backend;
    const r = loadProgress(backend);
    return { progress: r.progress, status: r.status };
  });

  const askedPersist = useRef(false);

  const commit = useCallback((next: Progress) => {
    const s = saveProgress(backendRef.current, next);
    setState((prev) => ({
      progress: next,
      // Keep showing a "recovered" notice until the next successful save after it.
      status: s === 'ok' && prev.status === 'recovered' ? 'recovered' : s,
    }));
    if (!askedPersist.current && s === 'ok') {
      askedPersist.current = true;
      void requestPersistence();
    }
  }, []);

  const progressRef = useRef(state.progress);
  progressRef.current = state.progress;

  const update = useCallback((fn: (p: Progress) => Progress) => commit(fn(progressRef.current)), [commit]);
  const replace = useCallback((p: Progress) => commit(p), [commit]);
  const deleteAll = useCallback(() => {
    deleteAllProgress(backendRef.current);
    const fresh = { ...defaultProgress(), uiLang: progressRef.current.uiLang };
    setState({ progress: fresh, status: backendRef.current ? 'ok' : 'unavailable' });
  }, []);

  const lang = state.progress.uiLang;
  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const value = useMemo<StoreValue>(
    () => ({
      progress: state.progress,
      status: state.status,
      lang,
      t: (key, vars) => translate(lang, key, vars),
      update,
      replace,
      deleteAll,
      today: () => toLocalDate(new Date()),
    }),
    [state, lang, update, replace, deleteAll],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('StoreProvider missing');
  return v;
}
