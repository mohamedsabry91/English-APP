import { useStore } from '../store';
import { go } from '../router';
import { lessonsForTrack, nextLesson } from '../../core/content';
import type { TrackId } from '../../core/types';
import { IconCheck } from '../Icons';

export function Lessons() {
  const { t, lang, progress } = useStore();
  const next = nextLesson(progress.track, progress.placement?.result ?? null, progress.completedLessons);
  const tracks: TrackId[] = progress.track === 'engineers' ? ['engineers', 'general'] : ['general', 'engineers'];
  return (
    <main className="screen" id="main" tabIndex={-1}>
      <h1>{t('lessons.title')}</h1>
      <p>{t('lessons.intro')}</p>
      {tracks.map((track) => (
        <section key={track}>
          <h2>{t(track === 'general' ? 'lessons.general' : 'lessons.engineers')}</h2>
          <ul className="list">
            {lessonsForTrack(track).map((l) => {
              const done = progress.completedLessons.includes(l.id);
              return (
                <li key={l.id}>
                  <button type="button" className="list-button" onClick={() => go('lesson', l.id)} data-testid={`lesson-${l.id}`}>
                    <span>
                      <bdi>{lang === 'ar' ? l.titleAr : l.titleEn}</bdi>
                    </span>
                    <span className="meta">
                      <bdi dir="ltr">{l.level}</bdi>
                      {done && (
                        <>
                          {' '}
                          <IconCheck />
                          <span className="sr-only">{t('lessons.done')}</span>
                        </>
                      )}
                      {next?.id === l.id && <> · {t('lessons.next')}</>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </main>
  );
}
