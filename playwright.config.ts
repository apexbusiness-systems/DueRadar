import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run sequentially for stateful db tests
  retries: 0,
  workers: 1, // Use single worker to prevent local DB test state collision
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: {
      args: ['--disable-blink-features=AutomationControlled'],
    },
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
      testMatch: [/.*landing\.spec\.ts/, /.*unauth\.spec\.ts/],
    },
    {
      name: 'authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: [/.*landing\.spec\.ts/, /.*unauth\.spec\.ts/, /.*auth\.setup\.ts/],
    },
  ],
  webServer: {
    command: 'pnpm --filter @workspace/frontend run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
