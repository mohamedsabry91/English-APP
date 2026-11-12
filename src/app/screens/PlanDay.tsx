import { useState } from 'react';
import { AudioButton } from '../AudioButton';
import { useStore } from '../store';
import { go } from '../router';
import { getPhrase, getPlan, getSayPrompt, getStory, getTask, reviewItemExists } from '../../core/content';
import type { McExercise, Phrase, Plan, PlanDay as PlanDayData, SayPrompt, Story } from '../../core/contentTypes';
import {
  PLAN_REVIEW_LIMIT,
  canStartDayToday,
  completeDay,
  learnPhrases,
  nextDayNumber,
  phrasesToRecall,
  recallCountsForBox,
  validCurrent,
  setRating,
  stepsForDay,
  type PlanStep,
} from '../../core/plan';
import { dueCards } from '../../core/scheduler';
import { topTags } from '../../core/stats';
import type { Progress, SelfRating } from '../../core/types';
import type { MsgKey } from '../../i18n';
import { recordReviewAnswer } from '../session';
import { ReviewItemView, getReviewTarget, targetTags } from '../ReviewItem';
import { PhraseRecall } from '../PhraseRecall';
import { ExerciseView } from '../ExerciseView';
import { WritingTaskView } from '../WritingTaskView';
import { TagName } from '../TagName';
import { ArText } from '../ArText';
import { Note } from '../Note';

const STEP_LABEL: Record<PlanStep, MsgKey> = {
  selfCheckStart: 'step.selfCheck',
  selfCheckEnd: 'step.selfCheck',
  review: 'step.review',
  learn: 'step.learn',
  story: 'step.story',
  recall: 'step.recall',
  message: 'step.message',
  say: 'step.say',
  mistakes: 'step.mistakes',
};

export function PlanDayScreen() {
  const { t, lang, progress, update, today } = useStore();
  const rec = progress.plan;
  const plan = rec ? getPlan(rec.planId) : undefined;
  const date = today();

  if (!rec || !plan) {
    return (
      <main className="screen" id="main" tabIndex={-1}>
        <p>{t('progress.noPlan')}</p>
        <button type="button" className="primary big" onClick={() => go('plans')}>{t('plan.see')}</button>
      </main>
    );
  }

  const current = validCurrent(plan, rec);
  const dayNum = current?.day ?? nextDayNumber(plan, rec);
  const title = lang === 'ar' ? plan.titleAr : plan.titleEn;
  const progressLink = (
    <button type="button" className="secondary" onClick={() => go('plan-progress')} data-testid="plan-progress-link">{t('plan.whatYouDid')}</button>
  );

  if (dayNum === null) {
    return (
      <main className="screen" id="main" tabIndex={-1}>
        <h1><bdi>{title}</bdi></h1>
        <p className="card" data-testid="plan-finished">{t('plan.finished')}</p>
        {progressLink}
      </main>
    );
  }
  if (!current && !canStartDayToday(rec, date)) {
    const last = rec.completedDays[rec.completedDays.length - 1];
    return (
      <main className="screen" id="main" tabIndex={-1}>
        <h1><bdi>{title}</bdi></h1>
        {last && <p data-testid="plan-day-done">{t('plan.dayDone', { n: last.day })}</p>}
        <p className="card" data-testid="plan-done-today">{t('plan.doneToday')}</p>
        {progressLink}
      </main>
    );
  }

  const day = plan.schedule.find((d) => d.day === dayNum) as PlanDayData;
  const steps = stepsForDay(plan, day);

  if (!current) {
    return (
      <main className="screen" id="main" tabIndex={-1}>
        <h1><bdi>{title}</bdi></h1>
        <p className="big-level" data-testid="plan-day-title">{t('plan.dayOf', { n: day.day, total: plan.days })}</p>
        <p>{day.type === 'review' ? t('plan.reviewDay') : t('plan.learnDay')}</p>
        {day.type === 'review' && <p className="banner" data-testid="review-day-note">{t('plan.reviewDayLonger')}</p>}
        <ol>
          {steps.map((s, i) => (
            <li key={i}>{t(STEP_LABEL[s])}</li>
          ))}
        </ol>
        <button
          type="button"
          className="primary big"
          onClick={() => update((p) => (p.plan ? { ...p, plan: { ...p.plan, current: { day: day.day, step: 0 } } } : p))}
          data-testid="plan-start-day"
        >
          {t('plan.startDay', { n: day.day })}
        </button>
        {progressLink}
      </main>
    );
  }

  const stepIdx = Math.min(current.step, steps.length - 1);
  const step = steps[stepIdx] as PlanStep;

  /** Finish this step, apply its changes, and move on (or finish the day). */
  const advance = (fn?: (p: Progress) => Progress) =>
    update((p) => {
      const q = fn ? fn(p) : p;
      const r = q.plan;
      if (!r) return q;
      if (stepIdx + 1 >= steps.length) return { ...q, plan: completeDay(plan, r, day.day, date) };
      return { ...q, plan: { ...r, current: { day: day.day, step: stepIdx + 1 } } };
    });

  const isLast = stepIdx + 1 >= steps.length;
  let body: React.JSX.Element;
  switch (step) {
    case 'selfCheckStart':
    case 'selfCheckEnd':
      body = (
        <SelfCheckStep
          plan={plan}
          end={step === 'selfCheckEnd'}
          onDone={(answers) =>
            advance((p) => (p.plan ? { ...p, plan: step === 'selfCheckEnd' ? { ...p.plan, selfCheckEnd: answers } : { ...p.plan, selfCheckStart: answers } } : p))
          }
        />
      );
      break;
    case 'review':
      body = <ReviewStep limit={day.type === 'review' ? PLAN_REVIEW_LIMIT.review : PLAN_REVIEW_LIMIT.learn} onDone={() => advance()} />;
      break;
    case 'learn':
      body = (
        <LearnStep
          phrases={day.phrases.map((id) => getPhrase(id)).filter((x): x is Phrase => !!x)}
          onDone={() => advance((p) => ({ ...p, cards: learnPhrases(p.cards, day.phrases, date) }))}
        />
      );
      break;
    case 'story': {
      const story = day.type === 'learn' ? getStory(day.storyId) : undefined;
      body = story ? <StoryStep story={story} onDone={() => advance()} /> : <NextOnly onDone={() => advance()} />;
      break;
    }
    case 'recall':
      body = <RecallStep ids={day.phrases} onDone={() => advance()} />;
      break;
    case 'message': {
      const task = day.type === 'review' ? getTask(day.writingTaskId) : undefined;
      body = task ? (
        <>
          <WritingTaskView task={task} onDone={() => advance()} />
          <button type="button" className="secondary" onClick={() => advance((p) => ({ ...p, writingDraft: null }))} data-testid="plan-skip-message">
            {t('step.skipMessage')}
          </button>
        </>
      ) : (
        <NextOnly onDone={() => advance()} />
      );
      break;
    }
    case 'say': {
      const prompt = getSayPrompt(day.sayId);
      body = prompt ? (
        <SayStep prompt={prompt} onDone={(rating) => advance((p) => (p.plan ? { ...p, plan: setRating(p.plan, day.day, rating) } : p))} />
      ) : (
        <NextOnly onDone={() => advance()} />
      );
      break;
    }
    case 'mistakes':
      body = <MistakesStep finishLabel={isLast ? t('step.finishDay') : t('common.next')} onDone={() => advance()} />;
      break;
  }

  return (
    <main className="screen" id="main" tabIndex={-1}>
      <p className="muted" data-testid="plan-step">
        <bdi>{title}</bdi> · {t('plan.dayOf', { n: day.day, total: plan.days })} · {t('plan.stepOf', { n: stepIdx + 1, total: steps.length })}
      </p>
      <div className="steps" aria-hidden="true">
        {steps.map((_, i) => (
          <span key={i} className={i <= stepIdx ? 'on' : ''} />
        ))}
      </div>
      <h1>{t(STEP_LABEL[step])}</h1>
      <div key={`${day.day}-${stepIdx}`} data-step={step} data-testid="plan-step-body">
        {body}
      </div>
      <p className="muted small">{t('session.leave')}</p>
    </main>
  );
}

function NextOnly({ onDone }: { onDone: () => void }) {
  const { t } = useStore();
  return <button type="button" className="primary big" onClick={onDone} data-testid="plan-next">{t('common.next')}</button>;
}

function SelfCheckStep({ plan, end, onDone }: { plan: Plan; end: boolean; onDone: (answers: SelfRating[]) => void }) {
  const { t, lang } = useStore();
  const [answers, setAnswers] = useState<(SelfRating | null)[]>(() => plan.selfCheck.map(() => null));
  const complete = answers.every((a) => a !== null);
  return (
    <section data-testid="self-check-step">
      <p>{end ? t('step.selfCheckEndIntro') : t('step.selfCheckIntro')}</p>
      {plan.selfCheck.map((s, i) => (
        <fieldset key={i} className="card">
          <legend>{lang === 'ar' ? <ArText>{s.ar}</ArText> : s.en}</legend>
          <div className="row">
            {([1, 2, 3] as SelfRating[]).map((r) => (
              <button
                key={r}
                type="button"
                className={'choice' + (answers[i] === r ? ' selected' : '')}
                aria-pressed={answers[i] === r}
                onClick={() => setAnswers(answers.map((a, j) => (j === i ? r : a)))}
                data-testid={`self-check-${i}-${r}`}
              >
                {t(`rate.${r}` as MsgKey)}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      <button type="button" className="primary big" disabled={!complete} onClick={() => onDone(answers as SelfRating[])} data-testid="self-check-save">
        {t('step.save')}
      </button>
    </section>
  );
}

function ReviewStep({ limit, onDone }: { limit: number; onDone: () => void }) {
  const { t, progress, update, today } = useStore();
  // Choose the items once, when the step opens.
  const [ids] = useState(() =>
    dueCards(progress.cards, today(), limit)
      .map((c) => c.id)
      .filter((id) => reviewItemExists(id)),
  );
  const [index, setIndex] = useState(0);
  const id = ids[index];
  const target = id ? getReviewTarget(id) : undefined;
  if (!target) {
    return (
      <section>
        <p data-testid="plan-nothing-due">{ids.length === 0 ? t('step.nothingDue') : ''}</p>
        <button type="button" className="primary big" onClick={onDone} data-testid="plan-next">{t('common.next')}</button>
      </section>
    );
  }
  return (
    <ReviewItemView
      key={target.id}
      target={target}
      counter={t('session.reviewCount', { n: index + 1, total: ids.length })}
      onAnswer={(ok) => update((p) => recordReviewAnswer(p, target.id, targetTags(target), ok, today()))}
      onNext={() => (index + 1 >= ids.length ? onDone() : setIndex(index + 1))}
    />
  );
}

function LearnStep({ phrases, onDone }: { phrases: Phrase[]; onDone: () => void }) {
  const { t } = useStore();
  const [index, setIndex] = useState(0);
  const ph = phrases[index];
  if (!ph) return <NextOnly onDone={onDone} />;
  return (
    <section data-testid="learn-step" data-phrase-id={ph.id}>
      <p className="muted">{t('recall.counter', { n: index + 1, total: phrases.length })}</p>
      <p className="muted small">{t('step.learnNote')}</p>
      <p className="written en-block question" lang="en" dir="ltr" data-testid="learn-phrase">{ph.en}</p>
      <AudioButton key={ph.id} clipId={ph.id} />
      <Note en={ph.cueEn} ar={ph.ar} />
      <Note en={ph.noteEn} ar={ph.noteAr} className="muted" />
      <button type="button" className="primary big" onClick={() => (index + 1 >= phrases.length ? onDone() : setIndex(index + 1))} data-testid="plan-next">
        {t('common.next')}
      </button>
    </section>
  );
}

function StoryStep({ story, onDone }: { story: Story; onDone: () => void }) {
  const { t, lang } = useStore();
  const [stage, setStage] = useState(0); // 0 = read, 1..3 = questions, 4 = retell
  const [showSample, setShowSample] = useState(false);
  const [text, setText] = useState('');
  if (stage === 0) {
    return (
      <section data-testid="story-step">
        <h2><bdi>{lang === 'ar' ? story.titleAr : story.titleEn}</bdi></h2>
        <ol className="list">
          {story.lines.map((l, i) => (
            <li key={i} className="example">
              <p className="en-block" lang="en" dir="ltr">{l.en}</p>
              <Note ar={l.ar} className="ar" />
            </li>
          ))}
        </ol>
        <button type="button" className="primary big" onClick={() => setStage(1)} data-testid="plan-next">{t('step.storyQuestions')}</button>
      </section>
    );
  }
  if (stage <= story.questions.length) {
    const q = story.questions[stage - 1];
    if (q) {
      const ex: McExercise = { id: q.id, type: 'mc', tags: [], prompt: q.prompt, options: q.options, answer: q.answer, explanationEn: q.explanationEn, explanationAr: q.explanationAr };
      return (
        <ExerciseView
          key={q.id}
          exercise={ex}
          counter={t('session.exerciseCount', { n: stage, total: story.questions.length })}
          onAnswer={() => {}}
          onNext={() => setStage(stage + 1)}
        />
      );
    }
  }
  const id = `retell-${story.id}`;
  return (
    <section data-testid="retell-step">
      <h2>{t('step.retell')}</h2>
      <p className="en-block" lang="en" dir="ltr">{story.retell.promptEn}</p>
      <p lang="ar" dir="rtl"><ArText>{story.retell.promptAr}</ArText></p>
      <label htmlFor={id}>{t('writing.yourText')}</label>
      <textarea id={id} dir="ltr" lang="en" maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} />
      <p className="muted small">{t('step.retellNote')}</p>
      {showSample ? (
        <>
          <h3>{t('step.sample')}</h3>
          <p className="written en-block" lang="en" dir="ltr" data-testid="retell-sample">{story.retell.sample}</p>
          <button type="button" className="primary big" onClick={onDone} data-testid="plan-next">{t('common.next')}</button>
        </>
      ) : (
        <button type="button" className="primary big" onClick={() => setShowSample(true)} data-testid="show-sample">{t('step.showSample')}</button>
      )}
    </section>
  );
}

function RecallStep({ ids, onDone }: { ids: string[]; onDone: () => void }) {
  const { t, progress, update, today } = useStore();
  // Choose once, when the step opens: phrases already answered today in the review step are left out.
  const [phrases] = useState(() =>
    phrasesToRecall(progress.cards, ids, today())
      .map((id) => getPhrase(id))
      .filter((x): x is Phrase => !!x),
  );
  const [index, setIndex] = useState(0);
  const ph = phrases[index];
  if (!ph) {
    return (
      <section>
        <p data-testid="recall-all-done">{t('step.recallAllDone')}</p>
        <NextOnly onDone={onDone} />
      </section>
    );
  }
  return (
    <>
      {index === 0 && <p className="banner info">{t('step.recallNote')}</p>}
      <PhraseRecall
        key={ph.id}
        phrase={ph}
        counter={t('recall.counter', { n: index + 1, total: phrases.length })}
        onAnswer={(knew) =>
          update((p) => {
            const date = today();
            const card = p.cards[ph.id];
            // A phrase that was never learned (a skipped day) becomes a learn-card now.
            if (!card) return { ...p, cards: learnPhrases(p.cards, [ph.id], date) };
            return recallCountsForBox(card, date) ? recordReviewAnswer(p, ph.id, [], knew, date) : p;
          })
        }
        onNext={() => (index + 1 >= phrases.length ? onDone() : setIndex(index + 1))}
      />
    </>
  );
}

function SayStep({ prompt, onDone }: { prompt: SayPrompt; onDone: (rating: SelfRating) => void }) {
  const { t } = useStore();
  const [shown, setShown] = useState(false);
  return (
    <section data-testid="say-step">
      <p className="honesty" data-testid="say-note">{t('step.sayNote')}</p>
      <p className="en-block question" lang="en" dir="ltr">{prompt.promptEn}</p>
      <p lang="ar" dir="rtl"><ArText>{prompt.promptAr}</ArText></p>
      {!shown ? (
        <button type="button" className="primary big" onClick={() => setShown(true)} data-testid="show-sample">{t('step.showSample')}</button>
      ) : (
        <>
          <h3>{t('step.sample')}</h3>
          <p className="written en-block" lang="en" dir="ltr" data-testid="say-sample">{prompt.sample}</p>
          <h3>{t('step.sayRate')}</h3>
          <div className="options">
            {([1, 2, 3] as SelfRating[]).map((r) => (
              <button key={r} type="button" className="option" onClick={() => onDone(r)} data-testid={`say-rate-${r}`}>
                {t(`sayRate.${r}` as MsgKey)}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function MistakesStep({ finishLabel, onDone }: { finishLabel: string; onDone: () => void }) {
  const { t, progress } = useStore();
  const top = topTags(progress.mistakeLog, 3);
  return (
    <section data-testid="mistakes-step">
      {top.length === 0 ? (
        <p>{t('mistakes.none')}</p>
      ) : (
        <ul>
          {top.map((c) => (
            <li key={c.tag}>
              <TagName id={c.tag} /> · {t('mistakes.times', { n: c.count })}
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="secondary" onClick={() => go('mistakes')}>{t('mistakes.title')}</button>
      <button type="button" className="primary big" onClick={onDone} data-testid="plan-finish-day">{finishLabel}</button>
    </section>
  );
}
