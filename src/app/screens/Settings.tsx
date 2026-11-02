import { useStore } from '../store';
import { go } from '../router';
import type { UiLang } from '../../core/types';

export function Settings() {
  const { t, progress, update } = useStore();
  const setLang = (l: UiLang) => update((p) => ({ ...p, uiLang: l }));
  return (
    <main className="screen" id="main" tabIndex={-1}>
      <h1>{t('settings.title')}</h1>
      <section className="card">
        <h2>{t('settings.language')}</h2>
        <div className="row">
          <button type="button" className={'choice' + (progress.uiLang === 'ar' ? ' selected' : '')} aria-pressed={progress.uiLang === 'ar'} lang="ar" dir="rtl" onClick={() => setLang('ar')} data-testid="settings-lang-ar">العربية</button>
          <button type="button" className={'choice' + (progress.uiLang === 'en' ? ' selected' : '')} aria-pressed={progress.uiLang === 'en'} lang="en" dir="ltr" onClick={() => setLang('en')} data-testid="settings-lang-en">English</button>
        </div>
      </section>
      <button type="button" className="secondary" onClick={() => go('about')}>{t('settings.about')}</button>
    </main>
  );
}
