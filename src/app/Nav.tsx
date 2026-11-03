import { useStore } from './store';
import { go } from './router';
import { IconBook, IconChart, IconGear, IconHome, IconPencil } from './Icons';
import type { MsgKey } from '../i18n';

const items: { id: string; key: MsgKey; Icon: () => React.JSX.Element }[] = [
  { id: 'today', key: 'nav.today', Icon: IconHome },
  { id: 'lessons', key: 'nav.lessons', Icon: IconBook },
  { id: 'mistakes', key: 'nav.mistakes', Icon: IconChart },
  { id: 'writing', key: 'nav.writing', Icon: IconPencil },
  { id: 'settings', key: 'nav.settings', Icon: IconGear },
];

export function Nav({ current }: { current: string }) {
  const { t } = useStore();
  return (
    <nav className="bottom-nav" aria-label={t('nav.main')}>
      {items.map(({ id, key, Icon }) => (
        <button
          key={id}
          type="button"
          className={'nav-item' + (current === id ? ' active' : '')}
          aria-current={current === id ? 'page' : undefined}
          onClick={() => go(id)}
          data-testid={`nav-${id}`}
        >
          <Icon />
          <span>{t(key)}</span>
        </button>
      ))}
    </nav>
  );
}
