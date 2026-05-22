import { spawnSync } from 'node:child_process'
import path from 'node:path'

// Seed the E2E admin via the same bootstrap script the operator uses for prod.
// Idempotent — re-running just confirms the admin already exists.
export default async function globalSetup(): Promise<void> {
  const email    = process.env.E2E_ADMIN_EMAIL    ?? 'e2e-admin@test.local'
  const password = process.env.E2E_ADMIN_PASSWORD ?? 'e2e-admin-pw-12345'
  const name     = process.env.E2E_ADMIN_NAME     ?? 'E2E Admin'

  process.env.E2E_ADMIN_EMAIL    = email
  process.env.E2E_ADMIN_PASSWORD = password

  const backendDir = path.resolve(__dirname, '../backend')
  const result = spawnSync(
    'bun',
    ['--env-file=.env', 'run', 'scripts/bootstrap-admin.ts'],
    {
      cwd: backendDir,
      env: {
        ...process.env,
        SUPERUSER_EMAIL: email,
        SUPERUSER_PASSWORD: password,
        SUPERUSER_NAME: name,
      },
      stdio: 'inherit',
    },
  )

  if (result.status !== 0) {
    throw new Error(`E2E admin bootstrap failed with exit code ${result.status}`)
  }
}
