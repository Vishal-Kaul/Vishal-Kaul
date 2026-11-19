import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'npm run build && npm run start -- -p 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: true,
    timeout: 180000,
  },
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'off',
  },
  projects: [{ name: 'chromium', use: {
        ...devices['Desktop Chrome'],
        launchOptions: { executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' },
      } }],
});
