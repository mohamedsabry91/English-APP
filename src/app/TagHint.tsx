import { TAGS } from '../core/content';
import { tagHints } from './tagHints';
import type { TagId } from '../core/types';
import { ArText } from './ArText';
import { useStore } from './store';

/**
 * "Why this may happen" notes for mistake tags: in simple English, or the older Arabic note.
 * Shows nothing for tags without a note, so a course without hints looks as before.
 */
export function TagHints({ ids }: { ids: readonly TagId[] }) {
  const { t } = useStore();
  const hints = tagHints(ids, TAGS);
  if (hints.length === 0) return null;
  return (
    <div className="tag-hint" data-testid="tag-hint">
      <p className="small strong">{t('hint.title')}</p>
      {hints.map((h) => (
        h.en ? (
          <p key={h.id} lang="en" dir="ltr" className="small" data-tag={h.id}>{h.en}</p>
        ) : (
          <p key={h.id} lang="ar" dir="rtl" className="small" data-tag={h.id}>
            <ArText>{h.ar ?? ''}</ArText>
          </p>
        )
      ))}
    </div>
  );
}
