import { useStore } from '../store';
import { go } from '../router';
import { hasEnoughForTrend, topTags, weeklyCounts } from '../../core/stats';
import { exercisesWithTag } from '../../core/content';
import { TagName } from '../TagName';

export function Mistakes() {
  const { t, progress, today } = useStore();
  const top = topTags(progress.mistakeLog);
  const weeks = weeklyCounts(progress.mistakeLog, today());
  const max = Math.max(1, ...weeks.map((w) => w.count));
  const waiting = Object.values(progress.cards).filter((c) => !c.learned).length;

  return (
    <main className="screen" id="main" tabIndex={-1}>
      <h1>{t('mistakes.title')}</h1>
      {top.length === 0 ? (
        <p className="card" data-testid="mistakes-none">{t('mistakes.none')}</p>
      ) : (
        <>
          <section className="card">
            <h2>{t('mistakes.top')}</h2>
            <ul className="list" data-testid="mistakes-top">
              {top.map((c) => (
                <li key={c.tag} className="example" data-testid={`mistake-${c.tag}`}>
                  <p>
                    <strong>
                      <TagName id={c.tag} />
                    </strong>
                  </p>
                  <p className="muted">
                    {t('mistakes.times', { n: c.count })}
                    {c.fromPlacement > 0 && <> · {t('mistakes.placementOnly')}</>}
                  </p>
                  {exercisesWithTag(c.tag).length > 0 ? (
                    <button type="button" className="secondary" onClick={() => go('practice', c.tag)} data-testid={`practise-${c.tag}`}>
                      {t('mistakes.practise')}
                    </button>
                  ) : (
                    <p className="muted">{t('mistakes.noExercise')}</p>
                  )}
                </li>
              ))}
            </ul>
            <p className="muted">{t('mistakes.toLearn', { n: waiting })}</p>
          </section>
          <section className="card">
            <h2>{t('mistakes.weekly')}</h2>
            {hasEnoughForTrend(weeks) ? (
              <>
                <table className="week-table" aria-label={t('mistakes.chartLabel')} data-testid="weekly-chart">
                  <tbody>
                    {weeks.map((w) => (
                      <tr key={w.week}>
                        <th scope="row">
                          <bdi dir="ltr">{w.week.slice(5)}</bdi>
                        </th>
                        <td className="bar-cell">
                          <div className="bar-track" aria-hidden="true">
                            <div className="bar-fill" style={{ width: `${(w.count / max) * 100}%` }} />
                          </div>
                        </td>
                        <td className="num">{w.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <p data-testid="not-enough">{t('mistakes.notEnough')}</p>
            )}
            <p className="muted small">{t('mistakes.weeklyNote')}</p>
          </section>
        </>
      )}
    </main>
  );
}
