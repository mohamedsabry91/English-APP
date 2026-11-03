import { useState } from 'react';
import { useStore } from '../store';
import { go } from '../router';
import { getPlan, getSayPrompt } from '../../core/content';
import { goalStatus, phrasesAtBox, planPhraseIds, practiceDays } from '../../core/plan';
import type { SelfRating } from '../../core/types';
import type { MsgKey } from '../../i18n';
import { ConfirmDialog } from '../ConfirmDialog';
import { PlanHonest } from '../PlanHonest';
import { ArText } from '../ArText';
import { IconCheck } from '../Icons';

/** "What you did": facts from this device only. No score, no percentage, no streak. */
export function PlanProgress() {
  const { t, lang, progress, update } = useStore();
  const [confirmStop, setConfirmStop] = useState(false);
  const rec = progress.plan;
  const plan = rec ? getPlan(rec.planId) : undefined;
  const ar = lang === 'ar';
  if (!rec || !plan) {
    return (
      <main className="screen" id="main" tabIndex={-1}>
        <h1>{t('plan.whatYouDid')}</h1>
        <p>{t('progress.noPlan')}</p>
        <button type="button" className="primary big" onClick={() => go('plans')}>{t('plan.see')}</button>
      </main>
    );
  }
  const ids = planPhraseIds(plan);
  const goals = goalStatus(plan, progress);
  const rateLabel = (r: SelfRating | undefined) => (r ? t(`rate.${r}` as MsgKey) : t('progress.notAnswered'));
  const ratings = [...rec.ratings].sort((a, b) => a.day - b.day);

  return (
    <main className="screen" id="main" tabIndex={-1}>
      <h1>{t('plan.whatYouDid')}</h1>
      <p className="muted"><bdi>{ar ? plan.titleAr : plan.titleEn}</bdi></p>

      <section className="card">
        <p data-testid="progress-days">{t('progress.daysPractised', { n: practiceDays(rec) })}</p>
        <p>{t('progress.daysDone', { n: rec.completedDays.length, total: plan.days })}</p>
        <p data-testid="progress-phrases">{t('progress.phrases', { n: phrasesAtBox(progress.cards, ids), total: ids.length })}</p>
      </section>

      <section className="card">
        <h2>{t('plan.goals')}</h2>
        <ul className="list" data-testid="progress-goals">
          {goals.map((g) => {
            const text = plan.goals.find((x) => x.id === g.id);
            return (
              <li key={g.id} className="example" data-testid={`goal-${g.id}`} data-reached={g.reached ? 'yes' : 'no'}>
                <p>{text ? ar ? <ArText>{text.ar}</ArText> : text.en : g.id}</p>
                <p className="muted">
                  {g.reached ? (
                    <>
                      <IconCheck /> {t('progress.reached')}
                    </>
                  ) : (
                    t('progress.notYet')
                  )}{' '}
                  · {t('progress.goalValue', { value: g.value, target: g.target })}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card">
        <h2>{t('progress.ratings')}</h2>
        {ratings.length === 0 ? (
          <p>{t('progress.noRatings')}</p>
        ) : (
          <ul data-testid="progress-ratings">
            {ratings.map((r) => {
              const say = plan.schedule.find((d) => d.day === r.day);
              const prompt = say ? getSayPrompt(say.sayId) : undefined;
              return (
                <li key={r.day}>
                  {t('progress.dayLabel', { n: r.day })}: {t(`sayRate.${r.rating}` as MsgKey)}
                  {prompt && (
                    <span className="muted"> · {ar ? <ArText>{prompt.promptAr}</ArText> : prompt.promptEn}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>{t('progress.selfCheck')}</h2>
        <table className="compare" data-testid="progress-self-check">
          <thead>
            <tr>
              <th scope="col">{t('progress.statement')}</th>
              <th scope="col">{t('progress.day1')}</th>
              <th scope="col">{t('progress.lastDay')}</th>
            </tr>
          </thead>
          <tbody>
            {plan.selfCheck.map((s, i) => (
              <tr key={i}>
                <td>{ar ? <ArText>{s.ar}</ArText> : s.en}</td>
                <td>{rateLabel(rec.selfCheckStart?.[i])}</td>
                <td>{rateLabel(rec.selfCheckEnd?.[i])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {rec.finishedOn ? (
        <section className="card" data-testid="progress-end">
          <h2>{t('progress.canNow')}</h2>
          <ul>
            {(ar ? plan.canDoAr : plan.canDoEn).map((x, i) => (
              <li key={i}>{ar ? <ArText>{x}</ArText> : x}</li>
            ))}
          </ul>
          <h2>{t('progress.cannotYet')}</h2>
          <ul>
            {(ar ? plan.cannotYetAr : plan.cannotYetEn).map((x, i) => (
              <li key={i}>{ar ? <ArText>{x}</ArText> : x}</li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="muted">{t('progress.atEnd')}</p>
      )}

      <PlanHonest plan={plan} />
      <p className="muted small" data-testid="progress-privacy">{t('progress.privacy')}</p>

      <button type="button" className="secondary" onClick={() => go('plan-day')} data-testid="progress-to-plan">{t('plan.open')}</button>
      <button type="button" className="danger" onClick={() => setConfirmStop(true)} data-testid="plan-stop">{t('plan.stop')}</button>
      {confirmStop && (
        <ConfirmDialog
          danger
          message={t('plan.stopConfirm')}
          confirmLabel={t('plan.stopYes')}
          cancelLabel={t('common.cancel')}
          onCancel={() => setConfirmStop(false)}
          onConfirm={() => {
            setConfirmStop(false);
            update((p) => ({ ...p, plan: null }));
            go('plans');
          }}
        />
      )}
    </main>
  );
}
