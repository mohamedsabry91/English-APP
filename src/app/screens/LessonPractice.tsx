import { useState } from 'react';
import { useStore } from '../store';
import { go } from '../router';
import { getLesson, getTask } from '../../core/content';
import { ExerciseView } from '../ExerciseView';
import { LessonContent } from '../LessonContent';
import { recordLessonAnswer } from '../session';

/** Open any lesson from the list, outside the daily session. */
export function LessonPractice({ id }: { id: string }) {
  const { t, update, today } = useStore();
  const lesson = getLesson(id);
  const [index, setIndex] = useState(-1);
  if (!lesson) {
    return (
      <main className="screen" id="main" tabIndex={-1}>
        <button type="button" className="link-back" onClick={() => go('lessons')}>{t('common.back')}</button>
      </main>
    );
  }
  const ex = lesson.exercises[index];
  const finished = index >= lesson.exercises.length;
  const task = getTask(lesson.writingTaskId);
  return (
    <main className="screen" id="main" tabIndex={-1}>
      <button type="button" className="link-back" onClick={() => go('lessons')}>{t('common.back')}</button>
      {index < 0 && (
        <>
          <LessonContent lesson={lesson} />
          <button type="button" className="primary big" onClick={() => setIndex(0)} data-testid="to-exercises">{t('session.toExercises')}</button>
        </>
      )}
      {ex && (
        <ExerciseView
          key={ex.id}
          exercise={ex}
          counter={t('session.exerciseCount', { n: index + 1, total: lesson.exercises.length })}
          onAnswer={(ok) => update((p) => recordLessonAnswer(p, ex.id, ex.tags, ok, today()))}
          onNext={() => {
            const next = index + 1;
            if (next >= lesson.exercises.length) {
              update((p) => (p.completedLessons.includes(lesson.id) ? p : { ...p, completedLessons: [...p.completedLessons, lesson.id] }));
            }
            setIndex(next);
          }}
        />
      )}
      {finished && (
        <section className="card" data-testid="lesson-finished">
          <h2>{t('lessons.finished')}</h2>
          {task && (
            <button type="button" className="secondary" onClick={() => go('writing', task.id)}>
              {t('nav.writing')}: <bdi>{task.titleEn}</bdi>
            </button>
          )}
          <button type="button" className="primary big" onClick={() => go('lessons')}>{t('lessons.title')}</button>
        </section>
      )}
    </main>
  );
}
