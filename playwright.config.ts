import { defineConfig, devices } from '@playwright/test'

const FRONTEND_PORT = Number(process.env.E2E_FRONTEND_PORT ?? 5173)
const BACKEND_PORT = Number(process.env.E2E_BACKEND_PORT ?? 3000)
const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'bun run dev',
      cwd: './backend',
      url: `${BACKEND_URL}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        PORT: String(BACKEND_PORT),
        FRONTEND_URL,
        E2E: '1',
      },
    },
    {
      command: `bun run dev --port ${FRONTEND_PORT}`,
      cwd: './frontend',
      url: FRONTEND_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        VITE_API_URL: BACKEND_URL,
      },
    },
  ],
})
