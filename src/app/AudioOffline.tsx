import { useEffect, useMemo, useState } from 'react';
import { AUDIO, DEFAULT_COURSE_ID } from '../core/content';
import { clipUrl } from '../audio/player';
import { countDownloaded, downloadClips, removeCourseAudio, type DownloadResult } from '../audio/offline';
import { useStore } from './store';
import type { MsgKey } from '../i18n';

const NOTICE: Record<DownloadResult, MsgKey> = {
  ok: 'settings.audioOk',
  unavailable: 'settings.audioUnavailable',
  full: 'settings.audioFull',
  failed: 'settings.audioFailed',
  none: 'settings.audioFailed',
};

/** "Download for offline" for the course's speech clips. Shows nothing when the course has no audio. */
export function AudioOffline() {
  const { t } = useStore();
  const urls = useMemo(() => AUDIO.clips.map((c) => clipUrl(DEFAULT_COURSE_ID, c.file)).filter((u): u is string => u !== null), []);
  // Read from the cache itself, so the numbers are honest after a failed or partial download.
  const [stored, setStored] = useState<{ listed: number; course: number } | null>(null);
  const [notice, setNotice] = useState<MsgKey | null>(null);
  const [busy, setBusy] = useState(false);
  const recount = async () => setStored(await countDownloaded(urls, DEFAULT_COURSE_ID));
  useEffect(() => {
    if (urls.length) void countDownloaded(urls, DEFAULT_COURSE_ID).then(setStored);
  }, [urls]);
  if (urls.length === 0) return null;

  const download = async () => {
    setBusy(true);
    setNotice(NOTICE[await downloadClips(urls)]);
    await recount();
    setBusy(false);
  };
  const remove = async () => {
    setBusy(true);
    setNotice((await removeCourseAudio(DEFAULT_COURSE_ID)) ? 'settings.audioRemoved' : 'settings.audioUnavailable');
    await recount();
    setBusy(false);
  };

  return (
    <section className="card" data-testid="audio-offline">
      <h2>{t('settings.audioTitle')}</h2>
      <p className="muted">{t('settings.audioNote', { n: urls.length })}</p>
      {stored !== null && <p className="muted small" data-testid="audio-have">{t('settings.audioHave', { n: stored.listed, total: urls.length })}</p>}
      <button type="button" className="secondary" disabled={busy} onClick={download} data-testid="audio-download">{t('settings.audioDownload')}</button>
      {/* Shown whenever anything of this course is stored, even after a failed download. */}
      {stored !== null && stored.course > 0 && (
        <button type="button" className="secondary" disabled={busy} onClick={remove} data-testid="audio-remove">{t('settings.audioRemove')}</button>
      )}
      {notice && <p className="banner info" role="status">{t(notice)}</p>}
    </section>
  );
}
