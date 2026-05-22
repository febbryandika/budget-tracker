import { randomUUID } from 'node:crypto'
import { expect, type Page } from '@playwright/test'

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

export async function registerAndLogin(page: Page, user: TestUser = makeTestUser()): Promise<TestUser> {
  await page.goto('/register')
  await page.getByLabel('Name').fill(user.name)
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password', { exact: true }).fill(user.password)
  await page.getByRole('button', { name: /Create account/ }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
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
