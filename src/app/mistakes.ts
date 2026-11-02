import type { LocalDate, MistakeLogEntry, MistakeSource, Progress, TagId } from '../core/types';

/** Add mistakes to the log, merging with an existing entry for the same day, tag and source. */
export function logMistakes(p: Progress, tags: readonly TagId[], source: MistakeSource, date: LocalDate): Progress {
  if (tags.length === 0) return p;
  const log: MistakeLogEntry[] = p.mistakeLog.map((e) => ({ ...e }));
  for (const tag of tags) {
    const found = log.find((e) => e.date === date && e.tag === tag && e.source === source);
    if (found) found.count += 1;
    else log.push({ date, tag, source, count: 1 });
  }
  return { ...p, mistakeLog: log };
}
