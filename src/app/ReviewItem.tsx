import type { Exercise, Phrase } from '../core/contentTypes';
import { getExercise, getPhrase } from '../core/content';
import { ExerciseView } from './ExerciseView';
import { PhraseRecall } from './PhraseRecall';

/** A review card is a lesson exercise or a work phrase. */
export type ReviewTarget = { kind: 'exercise'; id: string; exercise: Exercise } | { kind: 'phrase'; id: string; phrase: Phrase };

export function getReviewTarget(id: string): ReviewTarget | undefined {
  const ex = getExercise(id);
  if (ex) return { kind: 'exercise', id, exercise: ex.exercise };
  const ph = getPhrase(id);
  if (ph) return { kind: 'phrase', id, phrase: ph };
  return undefined;
}

export function targetTags(t: ReviewTarget) {
  return t.kind === 'exercise' ? t.exercise.tags : [];
}

export function ReviewItemView({ target, counter, onAnswer, onNext }: { target: ReviewTarget; counter: string; onAnswer: (ok: boolean) => void; onNext: () => void }) {
  return target.kind === 'exercise' ? (
    <ExerciseView exercise={target.exercise} counter={counter} onAnswer={onAnswer} onNext={onNext} />
  ) : (
    <PhraseRecall phrase={target.phrase} counter={counter} onAnswer={onAnswer} onNext={onNext} />
  );
}
