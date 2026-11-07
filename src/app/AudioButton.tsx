import { useEffect, useState } from 'react';
import { AUDIO, DEFAULT_COURSE_ID } from '../core/content';
import { clipUrl, findClip, playClip, stopAudio } from '../audio/player';
import { useStore } from './store';

/**
 * "Listen" for one content item. Shows nothing when the course has no clip for it,
 * so a course without audio looks and works exactly as before.
 */
export function AudioButton({ clipId }: { clipId: string }) {
  const { t } = useStore();
  const [failed, setFailed] = useState(false);
  useEffect(() => () => stopAudio(), []);
  const clip = findClip(AUDIO, clipId);
  const url = clip ? clipUrl(DEFAULT_COURSE_ID, clip.file) : null;
  if (!clip || !url) return null;
  return (
    <div className="audio-row">
      <button
        type="button"
        className="secondary"
        onClick={async () => setFailed(!(await playClip(url)))}
        data-testid="audio-play"
      >
        {t('audio.listen')}
      </button>
      {clip.synthetic && <span className="muted small" data-testid="audio-synthetic">{t(clip.reviewed ? 'audio.synthetic' : 'audio.syntheticUnchecked')}</span>}
      {failed && <p className="muted small" role="status">{t('audio.failed')}</p>}
    </div>
  );
}
