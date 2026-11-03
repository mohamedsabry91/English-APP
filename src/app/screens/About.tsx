import { useStore } from '../store';
import { APP_NAME } from '../config';
import { go } from '../router';
import { AUDIO } from '../../core/content';

export function About() {
  const { t } = useStore();
  return (
    <main className="screen" id="main" tabIndex={-1}>
      <button type="button" className="link-back" onClick={() => go('settings')}>{t('common.back')}</button>
      <h1>{t('about.title')}</h1>
      <p className="app-name" dir="ltr">{APP_NAME}</p>
      <figure className="slogan" data-testid="slogan">
        <p lang="ar" dir="rtl">الحدّ الوحيد هو خيالك، دون تجاوز حدود الإسلام.</p>
        <p lang="en" dir="ltr">The only limit is your imagination, without exceeding the limits of Islam.</p>
      </figure>
      <p>{t('about.what')}</p>
      <h2>{t('about.privacyTitle')}</h2>
      <p data-testid="privacy-text">{t('about.privacy')}</p>
      <h2>{t('about.contentTitle')}</h2>
      <p>{t('about.content')}</p>
      <p>{t('about.notCert')}</p>
      <p data-testid="about-audio">{AUDIO.clips.length > 0 ? t('about.audio') : t('about.noSound')}</p>
      <p className="muted">{t('about.version', { v: '0.1.0' })}</p>
    </main>
  );
}
