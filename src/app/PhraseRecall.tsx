import { useState } from 'react';
import type { Phrase } from '../core/contentTypes';
import { useStore } from './store';
import { ArText } from './ArText';
import { AudioButton } from './AudioButton';

interface Props {
  phrase: Phrase;
  counter: string;
  /** Called once, when the learner says whether they knew the phrase. */
  onAnswer: (knew: boolean) => void;
  onNext: () => void;
}

/** A phrase card: see the Arabic, recall the English, then show it and say honestly whether you knew it. */
export function PhraseRecall({ phrase, counter, onAnswer, onNext }: Props) {
  const { t } = useStore();
  const [shown, setShown] = useState(false);
  const [answer, setAnswer] = useState<boolean | null>(null);
  return (
    <section className="exercise" data-testid="phrase-recall" data-phrase-id={phrase.id}>
      <p className="muted">{counter}</p>
      <h2 className="instruction">{t('recall.think')}</h2>
      <p className="question" lang="ar" dir="rtl">
        <ArText>{phrase.ar}</ArText>
      </p>
      {!shown ? (
        <button type="button" className="primary big" onClick={() => setShown(true)} data-testid="recall-show">
          {t('recall.show')}
        </button>
      ) : (
        <>
          <p className="written en-block question" lang="en" dir="ltr" data-testid="recall-phrase">{phrase.en}</p>
          <AudioButton clipId={phrase.id} />
          <p className="muted" lang="ar" dir="rtl">
            <ArText>{phrase.noteAr}</ArText>
          </p>
          {answer === null ? (
            <div className="row">
              <button type="button" onClick={() => { setAnswer(false); onAnswer(false); }} data-testid="recall-not-yet">{t('recall.notYet')}</button>
              <button type="button" className="primary" onClick={() => { setAnswer(true); onAnswer(true); }} data-testid="recall-knew">{t('recall.knew')}</button>
            </div>
          ) : (
            <button type="button" className="primary big" onClick={onNext} data-testid="next" autoFocus>
              {t('session.next')}
            </button>
          )}
        </>
      )}
    </section>
  );
}
