import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

const database = resolve(process.env.SUBMISSION_TRACKER_DB ?? '.e2e.sqlite3');
const useSystemChrome = process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === '1';

export default defineConfig({
  testDir: './tests/live',
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3002',
    trace: 'retain-on-failure',
    video: 'on',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(useSystemChrome ? { channel: 'chrome' } : {}),
      },
    },
  ],
  webServer: [
    {
      command:
        '../backend/.venv/bin/python ../backend/manage.py migrate && ../backend/.venv/bin/python ../backend/manage.py seed_submissions && ../backend/.venv/bin/python ../backend/manage.py runserver 127.0.0.1:8001 --noreload',
      url: 'http://127.0.0.1:8001/api/brokers/',
      env: { SUBMISSION_TRACKER_DB: database },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'npm run start -- --hostname 127.0.0.1 --port 3002',
      url: 'http://127.0.0.1:3002/submissions',
      reuseExistingServer: false,
      timeout: 120_000,
      env: { API_BASE_URL: 'http://127.0.0.1:8001/api' },
    },
  ],
});
