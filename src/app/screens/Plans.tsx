import { useStore } from '../store';
import { go } from '../router';
import { PLANS } from '../../core/content';
import { startPlan } from '../../core/plan';
import { PlanHonest } from '../PlanHonest';
import { ArText } from '../ArText';

/** The plan picker. It lists every available plan from the content files. */
export function Plans() {
  const { t, lang, progress, update, today } = useStore();
  const ar = lang === 'ar';
  return (
    <main className="screen" id="main" tabIndex={-1}>
      <h1>{t('plan.title')}</h1>
      <p>{t('plan.intro')}</p>
      {PLANS.map((plan) => {
        const active = progress.plan?.planId === plan.id;
        return (
          <section key={plan.id} className="card" data-testid={`plan-${plan.id}`}>
            <h2>
              <bdi>{ar ? plan.titleAr : plan.titleEn}</bdi>
            </h2>
            <p>{ar ? plan.summaryAr : plan.summaryEn}</p>
            <p className="muted">{t('plan.length', { days: plan.days, minutes: plan.minutesPerDay })}</p>
            <PlanHonest plan={plan} />
            <h3>{t('plan.howItWorks')}</h3>
            <p>{ar ? plan.howItWorksAr : plan.howItWorksEn}</p>
            <h3>{t('plan.goals')}</h3>
            <ul>
              {plan.goals.map((g) => (
                <li key={g.id}>{ar ? <ArText>{g.ar}</ArText> : g.en}</li>
              ))}
            </ul>
            <h3>{t('plan.eachDay')}</h3>
            <ul data-testid="plan-routine">
              {plan.routine.map((r, i) => (
                <li key={i}>
                  <strong>{t('plan.minutes', { n: r.minutes })}</strong> · {ar ? <ArText>{r.ar}</ArText> : r.en}
                </li>
              ))}
            </ul>
            {active ? (
              <>
                <p className="banner info">{t('plan.active')}</p>
                <button type="button" className="primary big" onClick={() => go('plan-day')} data-testid="plan-open">{t('plan.open')}</button>
              </>
            ) : (
              <button
                type="button"
                className="primary big"
                onClick={() => {
                  update((p) => ({ ...p, plan: startPlan(plan.id, today()) }));
                  go('plan-day');
                }}
                data-testid="plan-start"
              >
                {t('plan.start')}
              </button>
            )}
          </section>
        );
      })}
    </main>
  );
}
