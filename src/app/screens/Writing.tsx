import { useStore } from '../store';
import { go } from '../router';
import { WRITING_TASKS, getTask } from '../../core/content';
import { WritingTaskView } from '../WritingTaskView';
import { IconCheck } from '../Icons';

export function WritingList() {
  const { t, lang, progress } = useStore();
  const order = progress.track === 'engineers' ? ['engineers', 'general'] : ['general', 'engineers'];
  const tasks = [...WRITING_TASKS].sort((a, b) => order.indexOf(a.track) - order.indexOf(b.track));
  return (
    <main className="screen" id="main" tabIndex={-1}>
      <h1>{t('writing.title')}</h1>
      <p>{t('writing.intro')}</p>
      <p className="honesty">{t('writing.honesty')}</p>
      <ul className="list">
        {tasks.map((task) => (
          <li key={task.id}>
            <button type="button" className="list-button" onClick={() => go('writing', task.id)} data-testid={`task-${task.id}`}>
              <span>
                <bdi>{lang === 'ar' ? task.titleAr : task.titleEn}</bdi>
              </span>
              <span className="meta">
                {t(task.track === 'general' ? 'writing.track.general' : 'writing.track.engineers')} · <bdi dir="ltr">{task.level}</bdi>
                {progress.completedWriting.includes(task.id) && (
                  <>
                    {' '}
                    <IconCheck />
                    <span className="sr-only">{t('writing.completed')}</span>
                  </>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}

export function WritingScreen({ id }: { id: string }) {
  const { t } = useStore();
  const task = getTask(id);
  return (
    <main className="screen" id="main" tabIndex={-1}>
      <button type="button" className="link-back" onClick={() => go('writing')}>{t('common.back')}</button>
      {task && <WritingTaskView task={task} onDone={() => go('writing')} />}
    </main>
  );
}
