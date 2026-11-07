import type { Lesson } from '../core/contentTypes';
import { exampleClipId } from '../audio/player';
import { ArText } from './ArText';
import { AudioButton } from './AudioButton';
import { useStore } from './store';

/** The lesson point: rule, Arabic and English comparison, examples. */
export function LessonContent({ lesson }: { lesson: Lesson }) {
  const { t, lang } = useStore();
  return (
    <article data-testid="lesson-content">
      <h1>
        {lang === 'ar' ? <ArText>{lesson.titleAr}</ArText> : <bdi>{lesson.titleEn}</bdi>}
      </h1>
      <p className="muted">
        <bdi dir="ltr">{lesson.level}</bdi> · {t('lesson.unreviewed')}
      </p>
      <section className="card">
        <h2>{t('lesson.rule')}</h2>
        {lang === 'ar' ? (
          <p lang="ar" dir="rtl"><ArText>{lesson.explanationAr}</ArText></p>
        ) : (
          <>
            <p lang="en" dir="ltr">{lesson.explanationEn}</p>
            <p lang="ar" dir="rtl" className="muted"><ArText>{lesson.explanationAr}</ArText></p>
          </>
        )}
      </section>
      {lesson.comparison.length > 0 && (
        <section className="card">
          <h2>{t('lesson.compare')}</h2>
          <ul className="list">
            {lesson.comparison.map((c, i) => (
              <li key={i} className="example">
                <p lang="ar" dir="rtl"><ArText>{c.ar}</ArText></p>
                <p className="en-block" lang="en" dir="ltr"><strong>{c.en}</strong></p>
                <p lang="ar" dir="rtl" className="ar"><ArText>{c.noteAr}</ArText></p>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="card">
        <h2>{t('lesson.examples')}</h2>
        <ul className="list">
          {lesson.examples.map((e, i) => (
            <li key={i} className="example" data-testid="lesson-example">
              <p className="en-block" lang="en" dir="ltr">{e.en}</p>
              <AudioButton clipId={exampleClipId(lesson.id, i)} />
              <p className="ar" lang="ar" dir="rtl"><ArText>{e.ar}</ArText></p>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
