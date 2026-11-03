import type { Plan } from '../core/contentTypes';
import { useStore } from './store';

/** The plan's honest position: Arabic first, then English, in both interface languages. */
export function PlanHonest({ plan }: { plan: Plan }) {
  const { t } = useStore();
  return (
    <section className="honesty" data-testid="plan-honest">
      <h3>{t('plan.honestTitle')}</h3>
      <p lang="ar" dir="rtl">{plan.honestAr}</p>
      <p lang="en" dir="ltr">{plan.honestEn}</p>
    </section>
  );
}
