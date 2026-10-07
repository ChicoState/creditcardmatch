import { defineConfig, devices } from '@playwright/test';

const localBaseURL = 'http://localhost:3001';
const configuredBaseURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html'], ['github']] : 'list',
  use: {
    baseURL: configuredBaseURL ?? localBaseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: configuredBaseURL
    ? undefined
    : {
        command: 'npm run dev -- --port 3001',
        reuseExistingServer: !process.env.CI,
        url: localBaseURL,
      },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
