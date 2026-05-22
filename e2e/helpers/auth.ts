import { randomUUID } from 'node:crypto'
import { expect, type Page } from '@playwright/test'

const BACKEND_URL = process.env.E2E_BACKEND_URL ?? 'http://localhost:3000'
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'e2e-admin@test.local'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'e2e-admin-pw-12345'

export type TestUser = {
  email: string
  password: string
  name: string
}

export function makeTestUser(): TestUser {
  const id = randomUUID().slice(0, 8)
  return {
    email: `e2e-${id}@test.local`,
    password: 'e2e-password-123',
    name: `E2E ${id}`,
  }
}

let cachedAdminCookie: string | null = null

async function adminCookie(): Promise<string> {
  if (cachedAdminCookie) return cachedAdminCookie
  const res = await fetch(`${BACKEND_URL}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`E2E admin sign-in failed (${res.status}): ${body}`)
  }
  const setCookie = res.headers.getSetCookie?.() ?? res.headers.get('set-cookie')?.split(/,(?=[^;]+=)/) ?? []
  const cookies = setCookie.map((c) => c.split(';')[0]).join('; ')
  if (!cookies) throw new Error('No admin session cookie returned')
  cachedAdminCookie = cookies
  return cookies
}

async function adminCreateUser(user: TestUser): Promise<void> {
  const cookie = await adminCookie()
  const res = await fetch(`${BACKEND_URL}/api/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ name: user.name, email: user.email, password: user.password }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Admin create-user failed (${res.status}): ${body}`)
  }
}

// Provision a fresh user via the admin API and sign them in through the UI.
// Replaces the old public-signup flow now that sign-up is admin-only.
export async function registerAndLogin(page: Page, user: TestUser = makeTestUser()): Promise<TestUser> {
  await adminCreateUser(user)
  await login(page, user)
  return user
}

export async function login(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password', { exact: true }).fill(user.password)
  await page.getByRole('button', { name: /^Sign in$/ }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
}

export async function signOut(page: Page): Promise<void> {
  // The Sign out action is inside the user menu in the top nav (avatar + chevron trigger).
  await page.locator('header button[aria-haspopup="menu"]').first().click()
  await page.getByRole('menuitem', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login$/)
}

// Sign in as the seeded E2E admin via the UI. Used by admin-specific tests.
export async function loginAsAdmin(page: Page): Promise<void> {
  await login(page, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: 'E2E Admin' })
}
