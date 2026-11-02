import type { WritingTask } from '../core/contentTypes';

// Placeholder until the writing checker is added (build step 6).
export function WritingTaskView({ task, onDone }: { task: WritingTask; onDone: () => void }) {
  return (
    <section>
      <p lang="en" dir="ltr">{task.promptEn}</p>
      <button type="button" className="primary big" onClick={onDone}>OK</button>
    </section>
  );
}
