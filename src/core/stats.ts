// Summaries for the My Mistakes page. Pure functions.
import { addDays, weekStart } from './dates';
import type { LocalDate, MistakeLogEntry, TagId } from './types';

export interface TagCount {
  tag: TagId;
  count: number;
  fromPlacement: number;
}

/** Mistake types, most frequent first. Placement mistakes are included and counted separately. */
export function topTags(log: readonly MistakeLogEntry[], limit = 5): TagCount[] {
  const map = new Map<TagId, TagCount>();
  for (const e of log) {
    const c = map.get(e.tag) ?? { tag: e.tag, count: 0, fromPlacement: 0 };
    c.count += e.count;
    if (e.source === 'placement') c.fromPlacement += e.count;
    map.set(e.tag, c);
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag)).slice(0, limit);
}

export interface WeekCount {
  week: LocalDate;
  count: number;
}

/** Practice mistakes (not placement) per week, for the last `weeks` weeks, oldest first. */
export function weeklyCounts(log: readonly MistakeLogEntry[], today: LocalDate, weeks = 8): WeekCount[] {
  const current = weekStart(today);
  const out: WeekCount[] = [];
  for (let i = weeks - 1; i >= 0; i--) out.push({ week: addDays(current, -7 * i), count: 0 });
  for (const e of log) {
    if (e.source === 'placement') continue;
    const w = weekStart(e.date);
    const slot = out.find((x) => x.week === w);
    if (slot) slot.count += e.count;
  }
  return out;
}

/** A trend needs data in at least two different weeks. */
export function hasEnoughForTrend(weeks: readonly WeekCount[]): boolean {
  return weeks.filter((w) => w.count > 0).length >= 2;
}
