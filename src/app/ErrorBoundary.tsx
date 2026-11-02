import { Component, type ErrorInfo, type ReactNode } from 'react';
import { deleteAllProgress, detectStorage } from '../core/storage';
import { translate, type MsgKey } from '../i18n';
import type { UiLang } from '../core/types';
import { ConfirmDialog } from './ConfirmDialog';

interface State {
  failed: boolean;
  confirmReset: boolean;
  resetFailed: boolean;
}

/** The interface language from the page, without the store (which may be what failed). */
function pageLang(): UiLang {
  try {
    return document.documentElement.lang === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
}

/**
 * Catches errors while rendering and shows a safe recovery screen in Arabic and English.
 * It sits outside the store, so it works even if loading progress is what failed.
 * Nothing is sent anywhere: the error is only written to the browser console.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false, confirmReset: false, resetFailed: false };

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('App error', error, info.componentStack);
  }

  private reload = () => {
    window.location.reload();
  };

  private goHome = () => {
    window.location.hash = '#/today';
    window.location.reload();
  };

  private reset = () => {
    const ok = deleteAllProgress(detectStorage());
    if (!ok) {
      this.setState({ confirmReset: false, resetFailed: true });
      return;
    }
    window.location.hash = '';
    window.location.reload();
  };

  render() {
    if (!this.state.failed) return this.props.children;
    const first = pageLang();
    const langs: UiLang[] = first === 'ar' ? ['ar', 'en'] : ['en', 'ar'];
    const both = (key: MsgKey) => langs.map((l) => translate(l, key)).join(' / ');
    return (
      <main className="screen" id="main" data-testid="error-screen">
        {langs.map((l) => (
          <section key={l} lang={l} dir={l === 'ar' ? 'rtl' : 'ltr'} className="card">
            <h1>{translate(l, 'error.title')}</h1>
            <p>{translate(l, 'error.body')}</p>
          </section>
        ))}
        <button type="button" className="primary big" onClick={this.reload} data-testid="error-reload">
          {both('error.reload')}
        </button>
        <button type="button" className="secondary" onClick={this.goHome} data-testid="error-home">
          {both('error.home')}
        </button>
        <button type="button" className="danger" onClick={() => this.setState({ confirmReset: true })} data-testid="error-reset">
          {both('error.reset')}
        </button>
        {this.state.resetFailed && (
          <p className="banner" role="status" data-testid="error-reset-failed">
            {both('error.resetFailed')}
          </p>
        )}
        {this.state.confirmReset && (
          <ConfirmDialog
            danger
            message={both('error.resetConfirm')}
            confirmLabel={both('error.resetYes')}
            cancelLabel={both('common.cancel')}
            onCancel={() => this.setState({ confirmReset: false })}
            onConfirm={this.reset}
          />
        )}
      </main>
    );
  }
}
