import { useRef, useState } from 'react';
import { useStore } from '../store';
import { go } from '../router';
import { importProgress, LIMITS, mergeImport, type ImportWarning } from '../../core/storage';
import type { Progress, TrackChoice, UiLang } from '../../core/types';
import { exportToFile } from '../exportFile';
import { ConfirmDialog } from '../ConfirmDialog';
import type { MsgKey } from '../../i18n';

const TRACKS: { id: TrackChoice; key: MsgKey }[] = [
  { id: 'general', key: 'track.general' },
  { id: 'engineers', key: 'track.engineers' },
  { id: 'both', key: 'track.both' },
];

export function Settings() {
  const { t, progress, update, replace, deleteAll, today } = useStore();
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pendingImport, setPendingImport] = useState<{ progress: Progress; warnings: ImportWarning[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const setLang = (l: UiLang) => update((p) => ({ ...p, uiLang: l }));
  const setTrack = (tr: TrackChoice) => update((p) => ({ ...p, track: tr, session: p.session && p.session.step === 'done' ? p.session : null }));

  const doExport = () => {
    const date = today();
    exportToFile(progress, date);
    update((p) => ({ ...p, lastExport: date }));
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    // Check the size before reading, so a huge file is never loaded into memory.
    if (file.size > LIMITS.importChars * 4) {
      setNotice(t('settings.importError.tooLarge'));
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      setNotice(t('settings.importError.json'));
      return;
    }
    const r = importProgress(text);
    if (!r.ok) {
      setNotice(t(`settings.importError.${r.reason}`));
      return;
    }
    setPendingImport({ progress: r.progress, warnings: r.warnings });
  };

  const retake = () => {
    update((p) => ({ ...p, placementInProgress: null, placement: p.placement }));
    go('placement');
  };

  return (
    <main className="screen" id="main" tabIndex={-1}>
      <h1>{t('settings.title')}</h1>
      {notice && (
        <p className="banner info" role="status" data-testid="settings-notice">{notice}</p>
      )}

      <section className="card">
        <h2>{t('settings.language')}</h2>
        <div className="row">
          <button type="button" className={'choice' + (progress.uiLang === 'ar' ? ' selected' : '')} aria-pressed={progress.uiLang === 'ar'} lang="ar" dir="rtl" onClick={() => setLang('ar')} data-testid="settings-lang-ar">العربية</button>
          <button type="button" className={'choice' + (progress.uiLang === 'en' ? ' selected' : '')} aria-pressed={progress.uiLang === 'en'} lang="en" dir="ltr" onClick={() => setLang('en')} data-testid="settings-lang-en">English</button>
        </div>
      </section>

      <section className="card">
        <h2>{t('settings.track')}</h2>
        <div className="options">
          {TRACKS.map((tr) => (
            <button key={tr.id} type="button" className={'option' + (progress.track === tr.id ? ' selected' : '')} aria-pressed={progress.track === tr.id} onClick={() => setTrack(tr.id)} data-testid={`track-${tr.id}`}>
              {t(tr.key)}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>{t('settings.placement')}</h2>
        {progress.placement && <p>{t('settings.currentLevel', { level: t(`result.${progress.placement.result}`) })}</p>}
        <p className="muted">{t('settings.retakeNote')}</p>
        <button type="button" className="secondary" onClick={retake} data-testid="retake">{t('settings.retake')}</button>
      </section>

      <section className="card">
        <h2>{t('settings.data')}</h2>
        <p className="muted">{progress.lastExport ? t('settings.lastExport', { date: progress.lastExport }) : t('settings.neverExported')}</p>
        <p className="muted small">{t('today.exportReminder')}</p>
        <button type="button" className="secondary" onClick={doExport} data-testid="export">{t('settings.export')}</button>
        <button type="button" className="secondary" onClick={() => fileRef.current?.click()} data-testid="import">{t('settings.import')}</button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onFile} data-testid="import-file" />
        <button type="button" className="danger" onClick={() => setConfirmDelete(true)} data-testid="delete-all">{t('settings.delete')}</button>
      </section>

      <section className="card">
        <h2>{t('about.privacyTitle')}</h2>
        <p>{t('about.privacy')}</p>
        <button type="button" className="secondary" onClick={() => go('about')} data-testid="about">{t('settings.about')}</button>
      </section>

      {confirmDelete && (
        <ConfirmDialog
          danger
          message={t('settings.deleteConfirm')}
          confirmLabel={t('settings.deleteYes')}
          cancelLabel={t('common.cancel')}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            deleteAll();
            setNotice(t('settings.deleted'));
          }}
        />
      )}
      {pendingImport && (
        <ConfirmDialog
          message={t('settings.importConfirm')}
          confirmLabel={t('settings.importYes')}
          cancelLabel={t('common.cancel')}
          onCancel={() => setPendingImport(null)}
          onConfirm={() => {
            // Courses on this device that the file does not have are kept.
            replace({ ...mergeImport(progress, pendingImport.progress), onboarded: true });
            setNotice(
              [
                t('settings.importOk'),
                ...(pendingImport.warnings.includes('planDropped') ? [t('settings.importPlanDropped')] : []),
                ...(pendingImport.warnings.includes('courseDropped') ? [t('settings.importCourseDropped')] : []),
              ].join(' '),
            );
            setPendingImport(null);
          }}
        />
      )}
    </main>
  );
}
