import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { go } from '../router';
import { exercisesWithTag } from '../../core/content';
import { ExerciseView } from '../ExerciseView';
import { recordLessonAnswer, recordReviewAnswer } from '../session';
import { TagName } from '../TagName';
import type { TagId } from '../../core/types';

const MAX = 6;

/** "Practise this" from My Mistakes: up to 6 exercises with one mistake tag, own mistakes first. */
export function TagPractice({ tag }: { tag: TagId }) {
  const { t, progress, update, today } = useStore();
  // Choose the exercises once, when the screen opens.
  const [list] = useState(() => {
    const all = exercisesWithTag(tag).map((x) => x.exercise);
    const withCard = all.filter((e) => progress.cards[e.id] && !progress.cards[e.id]?.learned);
    const rest = all.filter((e) => !withCard.includes(e));
    return [...withCard, ...rest].slice(0, MAX);
  });
  const [index, setIndex] = useState(0);
  const ex = list[index];
  const title = useMemo(() => <TagName id={tag} />, [tag]);
  return (
    <main className="screen" id="main" tabIndex={-1}>
      <button type="button" className="link-back" onClick={() => go('mistakes')}>{t('common.back')}</button>
      <h1>{title}</h1>
      {ex ? (
        <ExerciseView
          key={ex.id}
          exercise={ex}
          counter={t('session.exerciseCount', { n: index + 1, total: list.length })}
          onAnswer={(ok) =>
            update((p) => (p.cards[ex.id] ? recordReviewAnswer(p, ex.id, ex.tags, ok, today()) : recordLessonAnswer(p, ex.id, ex.tags, ok, today())))
          }
          onNext={() => setIndex(index + 1)}
        />
      ) : (
        <section className="card" data-testid="practice-done">
          <h2>{t('lessons.finished')}</h2>
          <button type="button" className="primary big" onClick={() => go('mistakes')}>{t('mistakes.title')}</button>
        </section>
      )}
    </main>
  );
}
