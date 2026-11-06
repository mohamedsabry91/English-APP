import type { TagInfo } from '../core/contentTypes';
import type { TagId } from '../core/types';

/** The hints to show for some tags: only tags that have one, once each, in order. */
export function tagHints(ids: readonly TagId[], tags: readonly TagInfo[]): { id: TagId; ar: string }[] {
  const out: { id: TagId; ar: string }[] = [];
  for (const id of new Set(ids)) {
    const ar = tags.find((t) => t.id === id)?.hint?.ar;
    if (ar) out.push({ id, ar });
  }
  return out;
}
