import { useState } from 'react';
import { useStore } from '../store';
import { go } from '../router';
import { PLACEMENT } from '../../core/content';
import { placementState, scorePlacement } from '../../core/placement';
import { logMistakes } from '../mistakes';
import type { TagId } from '../../core/types';

export function Placement() {
  const { t, progress, update, today } = useStore();
  const pip = progress.placementInProgress;
  const [selected, setSelected] = useState<number | null>(null);

  if (!pip) {
    const begin = () => update((p) => ({ ...p, placementInProgress: { index: 0, answers: [] } }));
    const skip = () => {
      update((p) => ({ ...p, placementInProgress: null, placement: { result: 'START_A1', date: today(), correctByLevel: [], mistakeTags: [] } }));
      go('today');
    };
    return (
      <main className="screen" id="main" tabIndex={-1}>
        <h1>{t('placement.title')}</h1>
        <p>{t('placement.intro')}</p>
        <p className="muted">{t('result.disclaimer')}</p>
        <button type="button" className="primary big" onClick={begin} data-testid="placement-start">{t('placement.start')}</button>
        <button type="button" className="secondary" onClick={skip} data-testid="placement-skip">{t('placement.skip')}</button>
      </main>
    );
  }

  const state = placementState(PLACEMENT, pip.answers);
  const qIndex = state.next < 0 ? 0 : state.next;
  const q = PLACEMENT[qIndex];
  if (!q) return null;

  const submit = () => {
    if (selected === null) return;
    const answers = pip.answers.slice();
    answers[qIndex] = selected;
    const s = placementState(PLACEMENT, answers);
    setSelected(null);
    if (!s.finished) {
      update((p) => ({ ...p, placementInProgress: { index: s.next, answers } }));
      return;
    }
    const wrongTags: TagId[] = [];
    PLACEMENT.forEach((question, i) => {
      const a = answers[i];
      if (a !== null && a !== undefined && a !== question.answer && question.tag) wrongTags.push(question.tag);
    });
    const date = today();
    update((p) =>
      logMistakes(
        {
          ...p,
          placementInProgress: null,
          placement: { result: scorePlacement(s.correctByLevel), date, correctByLevel: s.correctByLevel, mistakeTags: Array.from(new Set(wrongTags)) },
          session: null,
        },
        wrongTags,
        'placement',
        date,
      ),
    );
    go('result');
  };

  return (
    <main className="screen" id="main" tabIndex={-1}>
      <h1>{t('placement.title')}</h1>
      <p aria-live="polite" data-testid="placement-progress">
        {t('placement.progress', { n: qIndex + 1, total: PLACEMENT.length })} · {t('placement.section', { level: q.level })}
      </p>
      <div className="progress" aria-hidden="true">
        <div style={{ width: `${(qIndex / PLACEMENT.length) * 100}%` }} />
      </div>
      <fieldset>
        <legend>{t('placement.choose')}</legend>
        <p className="en-block question" lang="en" dir="ltr" data-testid="placement-question">{q.prompt}</p>
        <div className="options" lang="en" dir="ltr">
          {q.options.map((o, i) => (
            <button
              key={i}
              type="button"
              className={'option' + (selected === i ? ' selected' : '')}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
              data-testid={`placement-option-${i}`}
            >
              {o}
            </button>
          ))}
        </div>
      </fieldset>
      <button type="button" className="primary big" disabled={selected === null} onClick={submit} data-testid="placement-next">
        {t('placement.next')}
      </button>
    </main>
  );
}
