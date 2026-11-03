import { useEffect, useMemo, useState } from 'react';
import { AUDIO, DEFAULT_COURSE_ID } from '../core/content';
import { clipUrl } from '../audio/player';
import { countDownloaded, downloadClips, removeClips } from '../audio/offline';
import { useStore } from './store';
import type { MsgKey } from '../i18n';

/** "Download for offline" for the course's speech clips. Shows nothing when the course has no audio. */
export function AudioOffline() {
  const { t } = useStore();
  const urls = useMemo(() => AUDIO.clips.map((c) => clipUrl(DEFAULT_COURSE_ID, c.file)).filter((u): u is string => u !== null), []);
  const [have, setHave] = useState<number | null>(null);
  const [notice, setNotice] = useState<MsgKey | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (urls.length) void countDownloaded(urls).then(setHave);
  }, [urls]);
  if (urls.length === 0) return null;

  const download = async () => {
    setBusy(true);
    const r = await downloadClips(urls);
    setNotice(r === 'ok' ? 'settings.audioOk' : r === 'unavailable' ? 'settings.audioUnavailable' : 'settings.audioFailed');
    setHave(await countDownloaded(urls));
    setBusy(false);
  };
  const remove = async () => {
    setBusy(true);
    if (await removeClips(urls)) setNotice('settings.audioRemoved');
    setHave(await countDownloaded(urls));
    setBusy(false);
  };

  return (
    <section className="card" data-testid="audio-offline">
      <h2>{t('settings.audioTitle')}</h2>
      <p className="muted">{t('settings.audioNote', { n: urls.length })}</p>
      {have !== null && <p className="muted small">{t('settings.audioHave', { n: have, total: urls.length })}</p>}
      <button type="button" className="secondary" disabled={busy} onClick={download} data-testid="audio-download">{t('settings.audioDownload')}</button>
      {have !== null && have > 0 && (
        <button type="button" className="secondary" disabled={busy} onClick={remove} data-testid="audio-remove">{t('settings.audioRemove')}</button>
      )}
      {notice && <p className="banner info" role="status">{t(notice)}</p>}
    </section>
  );
}
