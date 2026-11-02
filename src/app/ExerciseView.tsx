import { useMemo, useState } from 'react';
import { ArText } from './ArText';
import type { Exercise } from '../core/contentTypes';
import { isCorrect, rightAnswerText, shuffleWords, type Response } from '../core/answers';
import { useStore } from './store';
import { IconCheck, IconCross } from './Icons';
import type { MsgKey } from '../i18n';

interface Props {
  exercise: Exercise;
  /** Called once, when the learner checks an answer. */
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
  /** Feedback already given (after a reload mid-exercise this is undefined). */
  counter: string;
}

const INSTRUCTION: Record<Exercise['type'], MsgKey> = { mc: 'ex.mc', fill: 'ex.fill', reorder: 'ex.reorder', fix: 'ex.fix' };

/** Prompt text with the ___ gap shown as a visible blank. */
function Prompt({ text }: { text: string }) {
  const parts = text.split('___');
  return (
    <p className="en-block question" lang="en" dir="ltr">
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && <span className="gap" aria-label="blank">_____</span>}
        </span>
      ))}
    </p>
  );
}

export function ExerciseView({ exercise, onAnswer, onNext, counter }: Props) {
  const { t } = useStore();
  const [choice, setChoice] = useState<number | null>(null);
  const [text, setText] = useState(exercise.type === 'fix' ? exercise.sentence : '');
  const [built, setBuilt] = useState<number[]>([]);
  const [result, setResult] = useState<boolean | null>(null);
  const bank = useMemo(() => (exercise.type === 'reorder' ? shuffleWords(exercise.words, exercise.id) : []), [exercise]);

  const response: Response | null =
    exercise.type === 'mc'
      ? choice === null
        ? null
        : { kind: 'choice', index: choice }
      : exercise.type === 'reorder'
        ? built.length === bank.length
          ? { kind: 'order', words: built.map((i) => bank[i] as string) }
          : null
        : text.trim()
          ? { kind: 'text', text }
          : null;

  const check = () => {
    if (!response || result !== null) return;
    const ok = isCorrect(exercise, response);
    setResult(ok);
    onAnswer(ok);
  };

  const done = result !== null;
  const inputId = `ex-input-${exercise.id}`;

  return (
    <section className="exercise" data-testid="exercise" data-exercise-id={exercise.id} data-type={exercise.type}>
      <p className="muted" data-testid="exercise-counter">{counter}</p>
      <h2 className="instruction">{t(INSTRUCTION[exercise.type])}</h2>

      {exercise.type === 'mc' && (
        <>
          <Prompt text={exercise.prompt} />
          <div className="options" lang="en" dir="ltr" role="group">
            {exercise.options.map((o, i) => {
              let cls = 'option';
              if (done && i === exercise.answer) cls += ' right';
              else if (done && i === choice) cls += ' wrong';
              else if (choice === i) cls += ' selected';
              return (
                <button key={i} type="button" className={cls} aria-pressed={choice === i} disabled={done} onClick={() => setChoice(i)} data-testid={`option-${i}`}>
                  {o}
                </button>
              );
            })}
          </div>
        </>
      )}

      {exercise.type === 'fill' && (
        <>
          <Prompt text={exercise.prompt} />
          <label htmlFor={inputId}>{t('ex.typeHere')}</label>
          <input
            id={inputId}
            type="text"
            dir="ltr"
            lang="en"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={text}
            disabled={done}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && check()}
            data-testid="answer-input"
          />
        </>
      )}

      {exercise.type === 'fix' && (
        <>
          <p className="en-block question" lang="en" dir="ltr">{exercise.sentence}</p>
          <label htmlFor={inputId}>{t('ex.yourSentence')}</label>
          <input
            id={inputId}
            type="text"
            dir="ltr"
            lang="en"
            autoComplete="off"
            spellCheck={false}
            value={text}
            disabled={done}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && check()}
            data-testid="answer-input"
          />
        </>
      )}

      {exercise.type === 'reorder' && (
        <>
          <p className="muted" id={`${inputId}-built`}>{t('ex.built')}</p>
          <div className="built" dir="ltr" lang="en" aria-labelledby={`${inputId}-built`} data-testid="built">
            {built.map((bi, pos) => (
              <button key={pos} type="button" className="word" disabled={done} onClick={() => setBuilt(built.filter((_, p) => p !== pos))}>
                {bank[bi]}
              </button>
            ))}
          </div>
          <p className="muted" id={`${inputId}-bank`}>{t('ex.wordBank')}</p>
          <div className="word-bank" dir="ltr" lang="en" aria-labelledby={`${inputId}-bank`}>
            {bank.map((w, i) =>
              built.includes(i) ? null : (
                <button key={i} type="button" className="word" disabled={done} onClick={() => setBuilt([...built, i])} data-testid={`word-${i}`}>
                  {w}
                </button>
              ),
            )}
          </div>
          {!done && built.length > 0 && (
            <button type="button" className="secondary" onClick={() => setBuilt([])}>{t('ex.clear')}</button>
          )}
        </>
      )}

      {!done ? (
        <button type="button" className="primary big" disabled={!response} onClick={check} data-testid="check">
          {t('session.check')}
        </button>
      ) : (
        <>
          <div className={'feedback ' + (result ? 'ok' : 'bad')} role="status" data-testid="feedback" data-correct={result ? 'yes' : 'no'}>
            <p className="title">
              {result ? <IconCheck /> : <IconCross />}
              {result ? t('session.correct') : t('session.wrong')}
            </p>
            {!result && (
              <p>
                {t('session.answerIs')} <bdi className="en" lang="en" dir="ltr" data-testid="right-answer">{rightAnswerText(exercise)}</bdi>
              </p>
            )}
            <p lang="ar" dir="rtl" className="explanation"><ArText>{exercise.explanationAr}</ArText></p>
          </div>
          <button type="button" className="primary big" onClick={onNext} data-testid="next" autoFocus>
            {t('session.next')}
          </button>
        </>
      )}
    </section>
  );
}
