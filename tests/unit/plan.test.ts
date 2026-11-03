import { describe, expect, it } from 'vitest';
import { PLANS, ALL_PLANS, getPlan } from '../../src/core/content';
import {
  canStartDayToday,
  completeDay,
  goalStatus,
  learnPhrases,
  nextDayNumber,
  phraseGoalTarget,
  phrasesAtBox,
  planPhraseIds,
  practiceDays,
  recallCountsForBox,
  setRating,
  startPlan,
  stepsForDay,
  validCurrent,
} from '../../src/core/plan';
import { recordLearn, recordRight, dueCards } from '../../src/core/scheduler';
import { defaultProgress } from '../../src/core/storage';
import type { Plan } from '../../src/core/contentTypes';

const plan = getPlan('15-day-start') as Plan;

describe('learn-cards', () => {
  it('a learn-card starts in box 1, due tomorrow, with no mistakes, and moves up the usual boxes', () => {
    const c = recordLearn(undefined, 'ph-01', [], '2026-11-01');
    expect(c).toMatchObject({ box: 1, due: '2026-11-02', mistakes: 0, learned: false });
    expect(dueCards([c], '2026-11-01')).toEqual([]);
    const c2 = recordRight(c, '2026-11-02');
    expect(c2).toMatchObject({ box: 2, due: '2026-11-05' });
  });

  it('learning again does not reset an existing card', () => {
    const c = { ...recordLearn(undefined, 'ph-01', [], '2026-11-01'), box: 4 };
    expect(recordLearn(c, 'ph-01', [], '2026-11-09')).toBe(c);
    const cards = learnPhrases({ 'ph-01': c }, ['ph-01', 'ph-02'], '2026-11-09');
    expect(cards['ph-01']?.box).toBe(4);
    expect(cards['ph-02']?.box).toBe(1);
  });
});

describe('15-Day Start plan', () => {
  it('is the only available plan, and the picker is data-driven', () => {
    expect(PLANS.map((p) => p.id)).toEqual(['15-day-start']);
    expect(ALL_PLANS.every((p) => p.available)).toBe(true);
  });

  it('has 15 days: 12 learning days of 4 phrases (48 in all) and review days 6, 11 and 15', () => {
    expect(plan.days).toBe(15);
    expect(plan.schedule).toHaveLength(15);
    expect(plan.schedule.map((d) => d.day)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
    expect(plan.schedule.filter((d) => d.type === 'review').map((d) => d.day)).toEqual([6, 11, 15]);
    const learn = plan.schedule.filter((d) => d.type === 'learn');
    expect(learn).toHaveLength(12);
    for (const d of learn) expect(d.phrases).toHaveLength(4);
    const ids = planPhraseIds(plan);
    expect(ids).toHaveLength(48);
    expect(new Set(ids).size).toBe(48);
  });

  it('review days cover every phrase learned before them', () => {
    const learnedBefore = (day: number) => plan.schedule.filter((d) => d.type === 'learn' && d.day < day).flatMap((d) => d.phrases);
    const covered = plan.schedule.filter((d) => d.type === 'review').flatMap((d) => d.phrases);
    expect(new Set(covered)).toEqual(new Set(learnedBefore(16)));
  });

  it('a day is 15 minutes: 2 review, 4 phrases, 4 story, 3 say aloud, 2 My Mistakes', () => {
    expect(plan.minutesPerDay).toBe(15);
    expect(plan.routine.map((r) => r.minutes)).toEqual([2, 4, 4, 3, 2]);
    expect(plan.routine.reduce((s, r) => s + r.minutes, 0)).toBe(15);
  });

  it('has the steps in order, with the self-check on day 1 and day 15', () => {
    expect(stepsForDay(plan, plan.schedule[0]!)).toEqual(['selfCheckStart', 'review', 'learn', 'story', 'say', 'mistakes']);
    expect(stepsForDay(plan, plan.schedule[1]!)).toEqual(['review', 'learn', 'story', 'say', 'mistakes']);
    expect(stepsForDay(plan, plan.schedule[5]!)).toEqual(['review', 'recall', 'message', 'say', 'mistakes']);
    expect(stepsForDay(plan, plan.schedule[14]!)).toEqual(['review', 'recall', 'message', 'say', 'mistakes', 'selfCheckEnd']);
  });

  it('allows one plan day per calendar day and continues after missed days without a penalty', () => {
    let rec = startPlan(plan.id, '2026-11-01');
    expect(nextDayNumber(plan, rec)).toBe(1);
    rec = completeDay(plan, rec, 1, '2026-11-01');
    expect(canStartDayToday(rec, '2026-11-01')).toBe(false);
    expect(canStartDayToday(rec, '2026-11-05')).toBe(true);
    rec = completeDay(plan, rec, 2, '2026-11-05');
    expect(nextDayNumber(plan, rec)).toBe(3);
    expect(practiceDays(rec)).toBe(2);
  });

  it('finishes after the last day', () => {
    let rec = startPlan(plan.id, '2026-11-01');
    for (let d = 1; d <= 15; d++) rec = completeDay(plan, rec, d, `2026-11-${String(d).padStart(2, '0')}`);
    expect(nextDayNumber(plan, rec)).toBeNull();
    expect(rec.finishedOn).toBe('2026-11-15');
  });

  it('only due cards change box on a review day', () => {
    const c = recordLearn(undefined, 'ph-01', [], '2026-11-01');
    expect(recallCountsForBox(c, '2026-11-01')).toBe(false);
    expect(recallCountsForBox(c, '2026-11-02')).toBe(true);
    expect(recallCountsForBox(undefined, '2026-11-02')).toBe(false);
  });

  it('reports the goals honestly, from data on the device', () => {
    const p = defaultProgress();
    expect(goalStatus(plan, p).map((g) => [g.id, g.value, g.target, g.reached])).toEqual([
      ['phrases', 0, 25, false],
      ['messages', 0, 3, false],
      ['intro', 0, 1, false],
      ['days', 0, 12, false],
    ]);
    let rec = startPlan(plan.id, '2026-11-01');
    for (let d = 1; d <= 12; d++) rec = completeDay(plan, rec, d, `2026-11-${String(d).padStart(2, '0')}`);
    rec = setRating(rec, 15, 2);
    const ids = planPhraseIds(plan);
    const cards = Object.fromEntries(ids.slice(0, 25).map((id) => [id, { ...recordLearn(undefined, id, [], '2026-11-01'), box: 3 }]));
    const q = { ...p, plan: rec, cards, completedWriting: ['w-p15-request', 'w-p15-thanks', 'w-p15-delay'] };
    expect(goalStatus(plan, q).every((g) => g.reached)).toBe(true);
    expect(phrasesAtBox(cards, ids)).toBe(25);
    expect(phraseGoalTarget(48)).toBe(25);
  });

  it('keeps one self-rating per day', () => {
    let rec = startPlan(plan.id, '2026-11-01');
    rec = setRating(rec, 1, 1);
    rec = setRating(rec, 1, 3);
    expect(rec.ratings).toEqual([{ day: 1, rating: 3 }]);
  });
});

describe('validCurrent', () => {
  it('ignores a day in progress that is not in the plan or is already done', () => {
    const rec = { ...startPlan(plan.id, '2026-11-01'), completedDays: [{ day: 1, date: '2026-11-01' }] };
    expect(validCurrent(plan, { ...rec, current: { day: 2, step: 1 } })).toEqual({ day: 2, step: 1 });
    expect(validCurrent(plan, { ...rec, current: { day: 99, step: 1 } })).toBeNull();
    expect(validCurrent(plan, { ...rec, current: { day: 1, step: 1 } })).toBeNull();
    expect(validCurrent(plan, rec)).toBeNull();
  });
});
