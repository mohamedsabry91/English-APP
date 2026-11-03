import { useStore } from './store';
import { go } from './router';
import { PLANS, getPlan } from '../core/content';
import { canStartDayToday, nextDayNumber } from '../core/plan';

/** The plan on the Today screen: a short invitation, or today's plan day. */
export function PlanCard() {
  const { t, lang, progress, today } = useStore();
  const rec = progress.plan;
  const plan = rec ? getPlan(rec.planId) : undefined;
  if (!rec || !plan) {
    if (PLANS.length === 0) return null;
    return (
      <section className="card" data-testid="plan-card">
        <p>{t('plan.cta')}</p>
        <button type="button" className="secondary" onClick={() => go('plans')} data-testid="plan-see">{t('plan.see')}</button>
      </section>
    );
  }
  const next = rec.current?.day ?? nextDayNumber(plan, rec);
  const title = lang === 'ar' ? plan.titleAr : plan.titleEn;
  let line: string;
  let action: string | null = null;
  if (next === null) line = t('plan.finished');
  else if (!rec.current && !canStartDayToday(rec, today())) line = t('plan.doneToday');
  else {
    line = t('plan.dayOf', { n: next, total: plan.days });
    action = rec.current ? t('plan.continueDay', { n: next }) : t('plan.startDay', { n: next });
  }
  return (
    <section className="card" data-testid="plan-card">
      <h2><bdi>{title}</bdi></h2>
      <p data-testid="plan-card-line">{line}</p>
      {action && (
        <button type="button" className="primary big" onClick={() => go('plan-day')} data-testid="plan-card-start">{action}</button>
      )}
      <button type="button" className="secondary" onClick={() => go('plan-progress')} data-testid="plan-card-progress">{t('plan.whatYouDid')}</button>
    </section>
  );
}
