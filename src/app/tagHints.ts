import type { TagInfo } from '../core/contentTypes';
import type { TagId } from '../core/types';

/**
 * The hints to show for some tags: only tags that have one, once each, in order.
 * The English hint is used when the tag has one, otherwise the older Arabic one.
 */
export function tagHints(ids: readonly TagId[], tags: readonly TagInfo[]): { id: TagId; en?: string; ar?: string }[] {
  const out: { id: TagId; en?: string; ar?: string }[] = [];
  for (const id of new Set(ids)) {
    const hint = tags.find((t) => t.id === id)?.hint;
    if (hint?.en) out.push({ id, en: hint.en });
    else if (hint?.ar) out.push({ id, ar: hint.ar });
  }
  return out;
}
