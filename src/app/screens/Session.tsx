import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { go } from '../router';
import { getLesson, getTask, reviewItemExists } from '../../core/content';
import { ReviewItemView, getReviewTarget, targetTags, type ReviewTarget } from '../ReviewItem';
import { LessonContent } from '../LessonContent';
import { WritingTaskView } from '../WritingTaskView';
import { activeSession, advanceStep, afterExercise, afterReviewItem, recordLessonAnswer, recordReviewAnswer } from '../session';
import type { MsgKey } from '../../i18n';

const STEPS: { step: 'review' | 'lesson' | 'exercises' | 'writing'; key: MsgKey }[] = [
  { step: 'review', key: 'session.review' },
  { step: 'lesson', key: 'session.lesson' },
  { step: 'exercises', key: 'session.exercises' },
  { step: 'writing', key: 'session.writing' },
];

interface Pinned {
  item: ReviewTarget;
  counter: string;
  part: number;
}

export function Session() {
  const { t, progress, update, today } = useStore();
  const session = activeSession(progress, today());
  const [pinned, setPinned] = useState<Pinned | null>(null);

  const missingReview = !pinned && session?.step === 'review' && !reviewItemExists(session.reviewIds[session.reviewIndex] ?? '');
  useEffect(() => {
    if (!session && !pinned) go('today');
  }, [session, pinned]);
  useEffect(() => {
    // A review item whose exercise no longer exists is skipped.
    if (missingReview) update((p) => afterReviewItem(p));
  }, [missingReview, update]);
  if (!session && !pinned) return null;

  const lesson = session ? getLesson(session.lessonId) : undefined;
  const stepIndex = pinned ? pinned.part : Math.max(0, STEPS.findIndex((s) => s.step === session?.step));

  const header = (
    <>
      <p className="muted" data-testid="session-part">
        {t('session.part', { n: stepIndex + 1 })} · {t(STEPS[stepIndex]?.key ?? 'session.review')}
      </p>
      <div className="steps" aria-hidden="true">
        {STEPS.map((s, i) => (
          <span key={s.step} className={i <= stepIndex ? 'on' : ''} />
        ))}
      </div>
    </>
  );

  let body: React.JSX.Element | null = null;
  // The exercise on screen. It stays "pinned" after checking, so its feedback stays visible
  // even though the saved session has already moved on (a reload then continues with the next item).
  let current: { item: ReviewTarget; counter: string; part: number; onAnswer: (ok: boolean) => void } | null = null;
  let banner: React.JSX.Element | null = null;

  if (pinned) {
    current = { ...pinned, onAnswer: () => {} };
  } else if (session && lesson) {
    if (session.step === 'review') {
      const id = session.reviewIds[session.reviewIndex];
      const found = id ? getReviewTarget(id) : undefined;
      if (found) {
        const counter = t('session.reviewCount', { n: session.reviewIndex + 1, total: session.reviewIds.length });
        if (session.reviewIndex === 0) banner = <p className="banner info">{t('session.reviewIntro')}</p>;
        current = {
          item: found,
          counter,
          part: 0,
          onAnswer: (ok) => {
            setPinned({ item: found, counter, part: 0 });
            update((p) => afterReviewItem(recordReviewAnswer(p, found.id, targetTags(found), ok, today())));
          },
        };
      }
    } else if (session.step === 'lesson') {
      body = (
        <>
          <LessonContent lesson={lesson} />
          <button type="button" className="primary big" onClick={() => update(advanceStep)} data-testid="to-exercises">
            {t('session.toExercises')}
          </button>
        </>
      );
    } else if (session.step === 'exercises') {
      const ex = lesson.exercises[session.exerciseIndex];
      if (ex) {
        const counter = t('session.exerciseCount', { n: session.exerciseIndex + 1, total: lesson.exercises.length });
        const item: ReviewTarget = { kind: 'exercise', id: ex.id, exercise: ex };
        current = {
          item,
          counter,
          part: 2,
          onAnswer: (ok) => {
            setPinned({ item, counter, part: 2 });
            update((p) => afterExercise(recordLessonAnswer(p, ex.id, ex.tags, ok, today())));
          },
        };
      }
    } else if (session.step === 'writing') {
      const task = session.writingTaskId ? getTask(session.writingTaskId) : undefined;
      body = task ? (
        <>
          <WritingTaskView task={task} onDone={() => update(advanceStep)} />
          <button type="button" className="secondary" onClick={() => update((p) => advanceStep({ ...p, writingDraft: null }))} data-testid="skip-writing">
            {t('session.skipWriting')}
          </button>
        </>
      ) : null;
    } else if (session.step === 'done') {
      body = (
        <section className="card" data-testid="session-done">
          <h1>{t('today.doneTitle')}</h1>
          <p>{t('today.doneBody')}</p>
          <button type="button" className="primary big" onClick={() => go('today')} data-testid="session-home">
            {t('session.home')}
          </button>
        </section>
      );
    }
  }

  if (current) {
    body = (
      <>
        {banner}
        <ReviewItemView
          key={`${current.part}-${current.item.id}`}
          target={current.item}
          counter={current.counter}
          onAnswer={current.onAnswer}
          onNext={() => setPinned(null)}
        />
      </>
    );
  }

  return (
    <main className="screen" id="main" tabIndex={-1}>
      {session?.step !== 'done' || pinned ? header : null}
      {body}
      {(session?.step !== 'done' || pinned) && <p className="muted small">{t('session.leave')}</p>}
    </main>
  );
}
