import { defineConfig, devices } from '@playwright/test';

// E2E chạy trên bản BUILD thật (vite preview, port 4173) — build trước khi chạy:
// npm run build && npm run test:e2e
// testMatch *.e2e.ts để vitest (match *.test.ts) không nuốt nhầm. Xem feat-e2e-tests SPEC.
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  timeout: 60_000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run preview',
    port: 4173,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
