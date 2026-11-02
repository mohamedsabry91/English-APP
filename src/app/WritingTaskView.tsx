import { useState } from 'react';
import { ArText } from './ArText';
import type { WritingTask } from '../core/contentTypes';
import { check, type Finding } from '../checker';
import { exercisesWithTag, getLesson } from '../core/content';
import { recordWrong } from '../core/scheduler';
import type { Progress, TagId } from '../core/types';
import { logMistakes } from './mistakes';
import { useStore } from './store';
import { TagName } from './TagName';

/** Longest text the writing box accepts. Tasks ask for 100 words or fewer. */
export const MAX_WRITING_CHARS = 2000;

export function countWords(text: string): number {
  const m = text.trim().match(/[A-Za-z0-9؀-ۿ'’-]+/g);
  return m ? m.length : 0;
}

/** Find an exercise to review for a writing mistake: first in the task's own lesson. */
function exerciseForTag(task: WritingTask, tag: TagId): string | null {
  const lesson = task.lessonId ? getLesson(task.lessonId) : undefined;
  const own = lesson?.exercises.find((e) => e.tags.includes(tag));
  if (own) return own.id;
  return exercisesWithTag(tag)[0]?.exercise.id ?? null;
}

/** Record writing findings: tags and dates only, never the text. */
export function recordWriting(p: Progress, task: WritingTask, findings: Finding[], today: string): Progress {
  const tags = findings.map((f) => f.tag);
  let next = logMistakes(p, tags, 'writing', today);
  const cards = { ...next.cards };
  for (const tag of new Set(tags)) {
    const id = exerciseForTag(task, tag);
    if (!id) continue;
    const ex = exercisesWithTag(tag).find((x) => x.exercise.id === id)?.exercise;
    cards[id] = recordWrong(cards[id], id, ex?.tags ?? [tag], today);
  }
  next = { ...next, cards, writingDraft: null, completedWriting: next.completedWriting.includes(task.id) ? next.completedWriting : [...next.completedWriting, task.id] };
  return next;
}

/** The learner's text with findings marked. */
function Marked({ text, findings }: { text: string; findings: Finding[] }) {
  const parts: React.JSX.Element[] = [];
  let pos = 0;
  findings.forEach((f, i) => {
    if (f.start < pos) return;
    if (f.start > pos) parts.push(<span key={`t${i}`}>{text.slice(pos, f.start)}</span>);
    parts.push(
      <mark key={`m${i}`} className="finding" data-testid="finding-mark">
        {text.slice(f.start, f.end)}
        <sup aria-hidden="true">{i + 1}</sup>
      </mark>,
    );
    pos = f.end;
  });
  if (pos < text.length) parts.push(<span key="end">{text.slice(pos)}</span>);
  return (
    <p className="written en-block" lang="en" dir="ltr" data-testid="written-text">
      {parts}
    </p>
  );
}

export function WritingTaskView({ task, onDone }: { task: WritingTask; onDone: () => void }) {
  const { t, lang, progress, update, today } = useStore();
  const draft = progress.writingDraft?.taskId === task.id ? progress.writingDraft.text : '';
  const [text, setText] = useState(draft);
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const words = countWords(text);
  const id = `writing-${task.id}`;

  const onChange = (v: string) => {
    setText(v);
    // The draft is kept only until the task is finished.
    update((p) => ({ ...p, writingDraft: { taskId: task.id, text: v } }));
  };

  const finish = () => {
    const f = findings ?? check(text, task.level);
    update((p) => recordWriting(p, task, f, today()));
    setText('');
    setFindings(null);
    onDone();
  };

  return (
    <section className="writing" data-testid="writing-task" data-task-id={task.id}>
      <h2>
        {lang === 'ar' ? <ArText>{task.titleAr}</ArText> : <bdi>{task.titleEn}</bdi>}
      </h2>
      <p className="en-block" lang="en" dir="ltr">{task.promptEn}</p>
      <p lang="ar" dir="rtl"><ArText>{task.promptAr}</ArText></p>
      <p className="muted">{t('writing.limit', { n: task.wordLimit })}</p>

      {findings === null ? (
        <>
          <label htmlFor={id}>{t('writing.yourText')}</label>
          <textarea id={id} dir="ltr" lang="en" spellCheck={false} maxLength={MAX_WRITING_CHARS} value={text} onChange={(e) => onChange(e.target.value.slice(0, MAX_WRITING_CHARS))} aria-describedby={`${id}-draft`} data-testid="writing-input" />
          <p className="muted" aria-live="polite">
            {t('writing.words', { n: words, max: task.wordLimit })}
          </p>
          {words > task.wordLimit && <p className="banner">{t('writing.tooLong')}</p>}
          <p className="muted small" id={`${id}-draft`} data-testid="draft-note">{t('writing.draftNote')}</p>
          <p className="honesty">{t('writing.honesty')}</p>
          <button type="button" className="primary big" disabled={words === 0} onClick={() => setFindings(check(text, task.level))} data-testid="writing-check">
            {t('writing.check')}
          </button>
        </>
      ) : (
        <div data-testid="writing-result">
          <p className="honesty" data-testid="honesty">{t('writing.honesty')}</p>
          <h3>{t('writing.yourText')}</h3>
          <Marked text={text} findings={findings} />
          <h3>{t('writing.found')}</h3>
          {findings.length === 0 ? (
            <p data-testid="nothing-marked">{t('writing.nothingMarked')}</p>
          ) : (
            <ol className="findings">
              {findings.map((f, i) => (
                <li key={i} className="finding-item" data-testid="finding" data-tag={f.tag}>
                  <p>
                    <span className="tag-pill">
                      <TagName id={f.tag} />
                    </span>{' '}
                    <bdi className="en" lang="en" dir="ltr">“{text.slice(f.start, f.end)}”</bdi>
                  </p>
                  {lang === 'ar' ? (
                    <p lang="ar" dir="rtl"><ArText>{f.explanationAr}</ArText></p>
                  ) : (
                    <>
                      <p lang="en" dir="ltr">{f.explanationEn}</p>
                      <p lang="ar" dir="rtl" className="muted"><ArText>{f.explanationAr}</ArText></p>
                    </>
                  )}
                  {f.suggestion !== undefined && f.suggestion !== '' && (
                    <p>
                      {t('writing.suggestion')} <bdi className="en" lang="en" dir="ltr">{f.suggestion}</bdi>
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
          <h3>{t('writing.model')}</h3>
          <p className="written en-block" lang="en" dir="ltr" data-testid="model-answer">{task.modelAnswer}</p>
          <h3>{t('writing.selfCheck')}</h3>
          <ul data-testid="self-check" lang="ar" dir="rtl" className="self-check">
            {task.selfCheckAr.map((s, i) => (
              <li key={i}><ArText>{s}</ArText></li>
            ))}
          </ul>
          <p className="muted small">{t('writing.privacy')}</p>
          <button type="button" className="secondary" onClick={() => setFindings(null)} data-testid="writing-edit">{t('writing.edit')}</button>
          <button type="button" className="primary big" onClick={finish} data-testid="writing-done">{t('writing.done')}</button>
        </div>
      )}
    </section>
  );
}
