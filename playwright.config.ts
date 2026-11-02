import { existsSync } from 'node:fs';
import { defineConfig, devices, webkit } from '@playwright/test';

const phone = { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

function webkitInstalled(): boolean {
  try {
    return existsSync(webkit.executablePath());
  } catch {
    return false;
  }
}

// Chromium always runs. WebKit runs when its browser is installed (npx playwright install webkit),
// unless E2E_WEBKIT=0. Set E2E_WEBKIT=1 to require it.
const wantWebkit = process.env.E2E_WEBKIT === '1' || (process.env.E2E_WEBKIT !== '0' && webkitInstalled());
if (!wantWebkit) console.warn('[playwright] WebKit is not installed here, so only Chromium runs.');

const projects = [{ name: 'chromium', use: { ...devices['Desktop Chrome'], ...phone } }];
if (wantWebkit) projects.push({ name: 'webkit', use: { ...devices['Desktop Safari'], ...phone } });

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  fullyParallel: false,
  workers: 2,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173/',
    locale: 'en-US',
    timezoneId: 'Asia/Riyadh',
    serviceWorkers: 'block',
  },
  projects,
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
