import { useStore } from '../store';
import { go } from '../router';
import { getLesson } from '../../core/content';
import { countDue } from '../../core/scheduler';
import { daysBetween } from '../../core/dates';
import { activeSession, plannedLessonId, startSession } from '../session';
import { exportToFile } from '../exportFile';
import { DAILY_REVIEW_LIMIT } from '../../core/scheduler';

export function Today() {
  const { t, lang, progress, update, today } = useStore();
  const date = today();
  const session = activeSession(progress, date);
  const name = (id: string | null | undefined) => {
    const l = id ? getLesson(id) : undefined;
    return l ? (lang === 'ar' ? l.titleAr : l.titleEn) : '';
  };

  const showExportReminder =
    progress.completedLessons.length > 0 &&
    (progress.lastExport === null ? true : daysBetween(progress.lastExport, date) >= 14);

  const exportNow = () => {
    exportToFile(progress, date);
    update((p) => ({ ...p, lastExport: date }));
  };

  let main: React.JSX.Element;
  if (session && session.step === 'done') {
    const next = plannedLessonId(progress);
    main = (
      <section className="card" data-testid="today-done">
        <h2>{t('today.doneTitle')}</h2>
        <p>{t('today.doneBody')}</p>
        {next && (
          <button type="button" className="secondary" onClick={() => go('lesson', next)} data-testid="another-lesson">
            {t('today.another')}
          </button>
        )}
      </section>
    );
  } else if (session) {
    main = (
      <section className="card">
        <h2>{t('today.plan')}</h2>
        <p>{t('today.lesson', { title: name(session.lessonId) })}</p>
        <button type="button" className="primary big" onClick={() => go('session')} data-testid="today-start">
          {t('today.continue')}
        </button>
      </section>
    );
  } else {
    const lessonId = plannedLessonId(progress);
    const due = Math.min(countDue(progress.cards, date), DAILY_REVIEW_LIMIT);
    main = (
      <section className="card">
        <h2>{t('today.plan')}</h2>
        <ul>
          <li data-testid="today-review">{due > 0 ? t('today.reviewItems', { n: due }) : t('today.noReview')}</li>
          {lessonId && <li>{t('today.lesson', { title: name(lessonId) })}</li>}
          <li>{t('today.writing')}</li>
        </ul>
        {!lessonId && <p>{t('today.allDone')}</p>}
        <button
          type="button"
          className="primary big"
          onClick={() => {
            update((p) => startSession(p, date));
            go('session');
          }}
          data-testid="today-start"
        >
          {t('today.start')}
        </button>
      </section>
    );
  }

  return (
    <main className="screen" id="main" tabIndex={-1}>
      <h1>{t('today.title')}</h1>
      <p className="promise">{t('home.promise')}</p>
      {!progress.placement && (
        <div className="banner info">
          <p>{t('today.noPlacement')}</p>
          <button type="button" className="secondary" onClick={() => go('placement')} data-testid="today-placement">
            {progress.placementInProgress ? t('placement.resume') : t('placement.start')}
          </button>
        </div>
      )}
      {main}
      {showExportReminder && (
        <div className="banner" data-testid="export-reminder">
          <p>{t('today.exportReminder')}</p>
          <button type="button" className="secondary" onClick={exportNow}>{t('today.exportNow')}</button>
        </div>
      )}
    </main>
  );
}
