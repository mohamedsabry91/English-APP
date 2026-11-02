import { useStore } from '../store';

export function Today() {
  const { t } = useStore();
  return (
    <main className="screen" id="main" tabIndex={-1}>
      <h1>{t('today.title')}</h1>
      <p className="promise">{t('home.promise')}</p>
    </main>
  );
}
