import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:3001', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === '1' ? { channel: 'chrome' } : {}),
      },
    },
  ],
  webServer: [
    {
      command: 'node tests/e2e/mock-api-server.mjs',
      url: 'http://127.0.0.1:8010/__test__/health',
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: 'npm run dev -- --hostname 127.0.0.1 --port 3001',
      url: 'http://127.0.0.1:3001/submissions',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        API_BASE_URL: 'http://127.0.0.1:8010/api',
        E2E_NEXT_DIST_DIR: '.next-e2e',
      },
    },
  ],
});
