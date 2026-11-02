import type { LocalDate } from './types';

const RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isLocalDate(s: unknown): s is LocalDate {
  if (typeof s !== 'string') return false;
  const m = RE.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toISOString().slice(0, 10) === s;
}

/** The learner's local calendar date for a moment in time. Only the UI layer calls this. */
export function toLocalDate(d: Date): LocalDate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toUtc(s: LocalDate): number {
  const m = RE.exec(s);
  if (!m) throw new Error(`Bad date: ${s}`);
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function addDays(s: LocalDate, days: number): LocalDate {
  return new Date(toUtc(s) + days * 86400000).toISOString().slice(0, 10);
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: LocalDate, b: LocalDate): number {
  return Math.round((toUtc(b) - toUtc(a)) / 86400000);
}

/** Monday of the week that contains the date. */
export function weekStart(s: LocalDate): LocalDate {
  const dow = new Date(toUtc(s)).getUTCDay(); // 0 = Sunday
  const offset = (dow + 6) % 7;
  return addDays(s, -offset);
}
