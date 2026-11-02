import { useStore } from './store';

export function StorageBanner() {
  const { status, t } = useStore();
  if (status === 'ok') return null;
  const key = status === 'unavailable' ? 'storage.unavailable' : status === 'full' ? 'storage.full' : 'storage.recovered';
  return (
    <div className="banner warn" role="status" data-testid="storage-banner">
      {t(key)}
    </div>
  );
}
