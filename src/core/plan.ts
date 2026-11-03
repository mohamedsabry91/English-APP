// Learning plans such as "15-Day Start". Pure functions: the date is always passed in.
import type { Plan, PlanDay } from './contentTypes';
import { isDue, recordLearn } from './scheduler';
import type { LocalDate, PlanRecord, Progress, ReviewCard, SelfRating } from './types';

export type PlanStep = 'selfCheckStart' | 'review' | 'learn' | 'story' | 'recall' | 'message' | 'say' | 'mistakes' | 'selfCheckEnd';

/** Review items shown in the plan's 2-minute review: more on review days. */
export const PLAN_REVIEW_LIMIT = { learn: 8, review: 20 } as const;

/** "Most" of the phrases, for the phrase goal: more than half. */
export function phraseGoalTarget(total: number): number {
  return Math.floor(total / 2) + 1;
}

export const DAYS_GOAL = 12;
export const BOX_GOAL = 3;

/** The steps of one plan day, in order. */
export function stepsForDay(plan: Plan, day: PlanDay): PlanStep[] {
  const steps: PlanStep[] = [];
  if (day.day === 1) steps.push('selfCheckStart');
  if (day.type === 'learn') steps.push('review', 'learn', 'story', 'say', 'mistakes');
  else steps.push('review', 'recall', 'message', 'say', 'mistakes');
  if (day.day === plan.days) steps.push('selfCheckEnd');
  return steps;
}

export function startPlan(planId: string, today: LocalDate): PlanRecord {
  return { planId, startedOn: today, completedDays: [], ratings: [], selfCheckStart: null, selfCheckEnd: null, current: null, finishedOn: null };
}

/** The day in progress, if it is a real day of this plan and not already done. Anything else counts as none. */
export function validCurrent(plan: Plan, rec: PlanRecord): { day: number; step: number } | null {
  const c = rec.current;
  if (!c || !plan.schedule.some((d) => d.day === c.day) || rec.completedDays.some((d) => d.day === c.day)) return null;
  return c;
}

/** The next plan day to do (1-based), or null when every day is done. */
export function nextDayNumber(plan: Plan, rec: PlanRecord): number | null {
  const done = new Set(rec.completedDays.map((d) => d.day));
  for (let d = 1; d <= plan.days; d++) if (!done.has(d)) return d;
  return null;
}

/** One plan day per calendar day: 15 minutes a day, not a race. */
export function canStartDayToday(rec: PlanRecord, today: LocalDate): boolean {
  return !rec.completedDays.some((d) => d.date === today);
}

/** Days on which the learner practised in the plan (distinct dates). */
export function practiceDays(rec: PlanRecord): number {
  return new Set(rec.completedDays.map((d) => d.date)).size;
}

/** Create learn-cards for new phrases. Existing cards keep their box. */
export function learnPhrases(cards: Record<string, ReviewCard>, ids: readonly string[], today: LocalDate): Record<string, ReviewCard> {
  const next = { ...cards };
  for (const id of ids) next[id] = recordLearn(next[id], id, [], today);
  return next;
}

/** Phrases at box 3 or higher (or learned). */
export function phrasesAtBox(cards: Record<string, ReviewCard>, ids: readonly string[], box = BOX_GOAL): number {
  return ids.filter((id) => {
    const c = cards[id];
    return !!c && (c.learned || c.box >= box);
  }).length;
}

export function planPhraseIds(plan: Plan): string[] {
  return plan.schedule.filter((d) => d.type === 'learn').flatMap((d) => d.phrases);
}

/** On a review day, only due cards change box. Others are practice only, so spacing stays honest. */
export function recallCountsForBox(card: ReviewCard | undefined, today: LocalDate): boolean {
  return !!card && isDue(card, today);
}

export interface GoalStatus {
  id: 'phrases' | 'messages' | 'intro' | 'days';
  value: number;
  target: number;
  reached: boolean;
}

export const MESSAGE_TASKS = ['w-p15-request', 'w-p15-thanks', 'w-p15-delay'] as const;

export function goalStatus(plan: Plan, p: Progress): GoalStatus[] {
  const rec = p.plan;
  const ids = planPhraseIds(plan);
  const phraseTarget = phraseGoalTarget(ids.length);
  const messageTasks = plan.schedule.flatMap((d) => (d.type === 'review' ? [d.writingTaskId] : []));
  const messagesDone = messageTasks.filter((id) => p.completedWriting.includes(id)).length;
  const introDone = !!rec && rec.ratings.some((r) => r.day === plan.days);
  const days = rec ? practiceDays(rec) : 0;
  const atBox = phrasesAtBox(p.cards, ids);
  return plan.goals.map((g) => {
    switch (g.id) {
      case 'phrases':
        return { id: g.id, value: atBox, target: phraseTarget, reached: atBox >= phraseTarget };
      case 'messages':
        return { id: g.id, value: messagesDone, target: messageTasks.length, reached: messagesDone >= messageTasks.length };
      case 'intro':
        return { id: g.id, value: introDone ? 1 : 0, target: 1, reached: introDone };
      case 'days':
        return { id: g.id, value: days, target: DAYS_GOAL, reached: days >= DAYS_GOAL };
    }
  });
}

/** Finish a plan day: record the date, clear the step in progress, and finish the plan on the last day. */
export function completeDay(plan: Plan, rec: PlanRecord, day: number, today: LocalDate): PlanRecord {
  const completedDays = rec.completedDays.some((d) => d.day === day) ? rec.completedDays : [...rec.completedDays, { day, date: today }];
  const finished = nextDayNumber(plan, { ...rec, completedDays }) === null;
  return { ...rec, completedDays, current: null, finishedOn: finished ? (rec.finishedOn ?? today) : rec.finishedOn };
}

export function setRating(rec: PlanRecord, day: number, rating: SelfRating): PlanRecord {
  return { ...rec, ratings: [...rec.ratings.filter((r) => r.day !== day), { day, rating }] };
}
