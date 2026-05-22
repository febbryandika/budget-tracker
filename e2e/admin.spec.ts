import { expect, test } from '@playwright/test'
import { loginAsAdmin, makeTestUser, registerAndLogin, signOut } from './helpers/auth'

test.describe('Admin', () => {
  test('non-admin user is redirected away from /admin', async ({ page }) => {
    await registerAndLogin(page)
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('admin can open the user-management page', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible()
    await expect(page.getByRole('button', { name: /New user/ })).toBeVisible()
  })

  test('admin can create a user, and that user can sign in', async ({ page }) => {
    const newUser = makeTestUser()

    await loginAsAdmin(page)
    await page.goto('/admin')
    await page.getByRole('button', { name: /New user/ }).click()
    await page.getByLabel('Name').fill(newUser.name)
    await page.getByLabel('Email').fill(newUser.email)
    await page.getByLabel('Password').fill(newUser.password)
    await page.getByRole('button', { name: /Create user/ }).click()

    await expect(page.getByRole('cell', { name: newUser.email })).toBeVisible()

    await signOut(page)
    await page.goto('/login')
    await page.getByLabel('Email').fill(newUser.email)
    await page.getByLabel('Password', { exact: true }).fill(newUser.password)
    await page.getByRole('button', { name: /^Sign in$/ }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('admin cannot delete their own account', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin')

    // Find the row containing "(you)" annotation and verify its delete button is disabled.
    const selfRow = page.locator('tr', { hasText: '(you)' })
    await expect(selfRow).toBeVisible()
    await expect(selfRow.getByRole('button', { name: /Delete/ })).toBeDisabled()
  })
})
