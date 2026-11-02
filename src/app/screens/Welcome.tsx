import { useStore } from '../store';
import { go } from '../router';
import { APP_NAME } from '../config';
import type { UiLang } from '../../core/types';

export function Welcome() {
  const { t, lang, update, today } = useStore();
  const setLang = (l: UiLang) => update((p) => ({ ...p, uiLang: l }));
  const proceed = () => {
    update((p) => ({ ...p, onboarded: true, createdOn: p.createdOn ?? today() }));
    go('placement');
  };
  return (
    <main className="screen" id="main">
      <p className="app-name" dir="ltr">{APP_NAME}</p>
      <h1>{t('welcome.title')}</h1>
      <p className="promise">{t('home.promise')}</p>
      <fieldset className="lang-choice">
        <legend>{t('welcome.chooseLang')}</legend>
        <div className="row">
          <button type="button" className={'choice' + (lang === 'ar' ? ' selected' : '')} aria-pressed={lang === 'ar'} lang="ar" dir="rtl" onClick={() => setLang('ar')} data-testid="lang-ar">
            العربية
          </button>
          <button type="button" className={'choice' + (lang === 'en' ? ' selected' : '')} aria-pressed={lang === 'en'} lang="en" dir="ltr" onClick={() => setLang('en')} data-testid="lang-en">
            English
          </button>
        </div>
      </fieldset>
      <ul className="notice-list">
        <li>{t('welcome.adults')}</li>
        <li>{t('welcome.private')}</li>
        <li>{t('welcome.device')}</li>
        <li>{t('welcome.notCert')}</li>
        <li>{t('welcome.content')}</li>
      </ul>
      <button type="button" className="primary big" onClick={proceed} data-testid="welcome-continue">
        {t('welcome.continue')}
      </button>
    </main>
  );
}
