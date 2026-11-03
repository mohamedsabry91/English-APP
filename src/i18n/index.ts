import ar from './ar.json';
import en from './en.json';
import type { UiLang } from '../core/types';

export type Messages = typeof en;
export type MsgKey = keyof Messages;

const all: Record<UiLang, Messages> = { ar: ar as Messages, en };

export function translate(lang: UiLang, key: MsgKey, vars?: Record<string, string | number>): string {
  let s: string = all[lang][key] ?? all.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}

export const messages = all;
