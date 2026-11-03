import { useEffect } from 'react';
import { useStore } from './store';
import { go, useRoute } from './router';
import { Nav } from './Nav';
import { StorageBanner } from './StorageBanner';
import { Welcome } from './screens/Welcome';
import { Today } from './screens/Today';
import { Settings } from './screens/Settings';
import { About } from './screens/About';
import { Placement } from './screens/Placement';
import { PlacementResult } from './screens/PlacementResult';
import { Session } from './screens/Session';
import { Lessons } from './screens/Lessons';
import { LessonPractice } from './screens/LessonPractice';
import { Mistakes } from './screens/Mistakes';
import { TagPractice } from './screens/TagPractice';
import { WritingList, WritingScreen } from './screens/Writing';
import { Plans } from './screens/Plans';
import { PlanDayScreen } from './screens/PlanDay';
import { PlanProgress } from './screens/PlanProgress';
import type { TagId } from '../core/types';

const NAV_SCREENS = ['plans', 'plan-day', 'plan-progress', 'today', 'lessons', 'lesson', 'mistakes', 'writing', 'settings', 'about', 'session', 'practice'];

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
      case 'placement':
        body = <Placement />;
        break;
      case 'result':
        body = <PlacementResult />;
        break;
      case 'session':
        body = <Session />;
        break;
      case 'lessons':
        body = <Lessons />;
        break;
      case 'lesson':
        body = <LessonPractice key={arg} id={arg ?? ''} />;
        break;
      case 'mistakes':
        body = <Mistakes />;
        break;
      case 'practice':
        body = <TagPractice key={arg} tag={(arg ?? 'BE') as TagId} />;
        break;
      case 'writing':
        body = arg ? <WritingScreen key={arg} id={arg} /> : <WritingList />;
        break;
      case 'plans':
        body = <Plans />;
        break;
      case 'plan-day':
        body = <PlanDayScreen />;
        break;
      case 'plan-progress':
        body = <PlanProgress />;
        break;
      case 'about':
        body = <About />;
        break;
      default:
        body = <Today />;
    }
  }

  const navCurrent = screen === 'lesson' ? 'lessons' : screen === 'about' ? 'settings' : screen === 'practice' ? 'mistakes' : screen === 'session' || screen.startsWith('plan') ? 'today' : screen;
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
