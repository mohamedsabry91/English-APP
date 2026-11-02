import { useEffect } from 'react';
import { useStore } from './store';
import { go, useRoute } from './router';
import { Nav } from './Nav';
import { StorageBanner } from './StorageBanner';
import { Welcome } from './screens/Welcome';
import { Today } from './screens/Today';
import { Settings } from './screens/Settings';
import { About } from './screens/About';

const NAV_SCREENS = ['today', 'lessons', 'lesson', 'mistakes', 'writing', 'settings', 'about', 'session', 'practice'];

export function App() {
  const { progress } = useStore();
  const route = useRoute();
  const [screen = 'today', arg] = route;

  const needsWelcome = !progress.onboarded;
  useEffect(() => {
    if (needsWelcome && screen !== 'welcome') go('welcome');
  }, [needsWelcome, screen]);

  let body: React.JSX.Element;
  if (needsWelcome) body = <Welcome />;
  else {
    switch (screen) {
      case 'settings':
        body = <Settings />;
        break;
      case 'about':
        body = <About />;
        break;
      default:
        void arg;
        body = <Today />;
    }
  }

  const navCurrent = screen === 'lesson' ? 'lessons' : screen === 'about' ? 'settings' : screen === 'session' || screen === 'practice' ? 'today' : screen;
  return (
    <div className="app">
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        {progress.uiLang === 'ar' ? 'انتقل إلى المحتوى' : 'Skip to content'}
      </a>
      <StorageBanner />
      {body}
      {!needsWelcome && NAV_SCREENS.includes(screen) && <Nav current={navCurrent} />}
    </div>
  );
}
