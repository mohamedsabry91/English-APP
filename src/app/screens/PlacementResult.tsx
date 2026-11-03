import { useStore } from '../store';
import { go } from '../router';
import { getTag, nextLesson } from '../../core/content';
import { startLevel } from '../../core/placement';
import { TagName } from '../TagName';

export function PlacementResult() {
  const { t, progress, lang } = useStore();
  const r = progress.placement;
  if (!r) {
    return (
      <main className="screen" id="main" tabIndex={-1}>
        <button type="button" className="primary big" onClick={() => go('placement')}>{t('placement.start')}</button>
      </main>
    );
  }
  const lesson = nextLesson(progress.track, r.result, progress.completedLessons);
  return (
    <main className="screen" id="main" tabIndex={-1}>
      <h1>{t('result.title')}</h1>
      <section className="card">
        <h2>{t('result.level')}</h2>
        <p className="big-level" data-testid="result-level"><bdi>{t(`result.${r.result}`)}</bdi></p>
        <p>{t(`result.can.${r.result}`)}</p>
      </section>
      <section className="card">
        <h2>{t('result.mistakes')}</h2>
        {r.mistakeTags.length === 0 ? (
          <p>{t('result.noMistakes')}</p>
        ) : (
          <ul data-testid="result-mistakes">
            {r.mistakeTags.filter((id) => getTag(id)).map((id) => (
              <li key={id}><TagName id={id} /></li>
            ))}
          </ul>
        )}
      </section>
      <section className="card">
        <h2>{t('result.start')}</h2>
        <p>
          <bdi dir="ltr">{startLevel(r.result)}</bdi>
          {lesson && (
            <>
              {' · '}
              {lang === 'ar' ? lesson.titleAr : lesson.titleEn}
            </>
          )}
        </p>
      </section>
      <p className="honesty" data-testid="result-disclaimer">{t('result.disclaimer')}</p>
      <button type="button" className="primary big" onClick={() => go('today')} data-testid="result-continue">{t('result.continue')}</button>
    </main>
  );
}
