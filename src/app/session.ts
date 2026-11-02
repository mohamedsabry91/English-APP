// Daily session state changes. Pure functions over Progress; the date is passed in.
import { getExercise, getLesson, getTask, nextLesson, lessonPath } from '../core/content';
import { dueCards, recordRight, recordWrong } from '../core/scheduler';
import type { DailySession, LocalDate, Progress, TagId } from '../core/types';
import { logMistakes } from './mistakes';

/** Today's session if one is running or finished today; an unfinished older session also continues. */
export function activeSession(p: Progress, today: LocalDate): DailySession | null {
  const s = p.session;
  if (!s || !getLesson(s.lessonId)) return null;
  if (s.step !== 'done') return s;
  return s.date === today ? s : null;
}

export function plannedLessonId(p: Progress): string | null {
  const next = nextLesson(p.track, p.placement?.result ?? null, p.completedLessons);
  if (next) return next.id;
  return null;
}

export function startSession(p: Progress, today: LocalDate, lessonId?: string): Progress {
  const id = lessonId ?? plannedLessonId(p) ?? lessonPath(p.track, p.placement?.result ?? null)[0]?.id;
  if (!id) return p;
  const reviewIds = dueCards(p.cards, today)
    .filter((c) => getExercise(c.id))
    .map((c) => c.id);
  const session: DailySession = {
    date: today,
    lessonId: id,
    step: reviewIds.length > 0 ? 'review' : 'lesson',
    reviewIds,
    reviewIndex: 0,
    exerciseIndex: 0,
    writingTaskId: getLesson(id)?.writingTaskId ?? null,
  };
  return { ...p, session };
}

/** Record a lesson exercise answer: a wrong answer creates or resets a review card. */
export function recordLessonAnswer(p: Progress, exerciseId: string, tags: TagId[], correct: boolean, today: LocalDate): Progress {
  if (correct) return p;
  const card = recordWrong(p.cards[exerciseId], exerciseId, tags, today);
  return logMistakes({ ...p, cards: { ...p.cards, [exerciseId]: card } }, tags, 'lesson', today);
}

/** Record a review answer. */
export function recordReviewAnswer(p: Progress, exerciseId: string, tags: TagId[], correct: boolean, today: LocalDate): Progress {
  const existing = p.cards[exerciseId];
  if (correct) {
    if (!existing) return p;
    return { ...p, cards: { ...p.cards, [exerciseId]: recordRight(existing, today) } };
  }
  const card = recordWrong(existing, exerciseId, tags, today);
  return logMistakes({ ...p, cards: { ...p.cards, [exerciseId]: card } }, tags, 'review', today);
}

function withSession(p: Progress, s: DailySession): Progress {
  return { ...p, session: s };
}

function completeLesson(p: Progress, lessonId: string): Progress {
  return p.completedLessons.includes(lessonId) ? p : { ...p, completedLessons: [...p.completedLessons, lessonId] };
}

/** Move to the step after the current one is finished. */
export function advanceStep(p: Progress): Progress {
  const s = p.session;
  if (!s) return p;
  switch (s.step) {
    case 'review':
      return withSession(p, { ...s, step: 'lesson' });
    case 'lesson':
      return withSession(p, { ...s, step: 'exercises', exerciseIndex: 0 });
    case 'exercises': {
      const done = completeLesson(p, s.lessonId);
      const hasTask = s.writingTaskId !== null && getTask(s.writingTaskId) !== undefined;
      return withSession(done, { ...s, step: hasTask ? 'writing' : 'done' });
    }
    case 'writing':
      return withSession(p, { ...s, step: 'done' });
    case 'done':
      return p;
  }
}

/** After answering review item `reviewIndex`, point to the next one (or the next step). */
export function afterReviewItem(p: Progress): Progress {
  const s = p.session;
  if (!s) return p;
  const next = s.reviewIndex + 1;
  if (next >= s.reviewIds.length) return advanceStep(withSession(p, { ...s, reviewIndex: next }));
  return withSession(p, { ...s, reviewIndex: next });
}

export function afterExercise(p: Progress): Progress {
  const s = p.session;
  if (!s) return p;
  const lesson = getLesson(s.lessonId);
  const next = s.exerciseIndex + 1;
  if (!lesson || next >= lesson.exercises.length) return advanceStep(withSession(p, { ...s, exerciseIndex: next }));
  return withSession(p, { ...s, exerciseIndex: next });
}
