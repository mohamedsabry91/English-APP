import { defineConfig, devices } from '@playwright/test';

const phone = { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

// WebKit runs only if its browser is installed on this machine.
const projects = [{ name: 'chromium', use: { ...devices['Desktop Chrome'], ...phone } }];
if (process.env.E2E_WEBKIT !== '0') {
  projects.push({ name: 'webkit', use: { ...devices['Desktop Safari'], ...phone } });
}

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 2,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173/',
    locale: 'en-US',
    serviceWorkers: 'block',
  },
  projects,
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173/',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
