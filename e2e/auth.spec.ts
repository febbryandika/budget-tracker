import { expect, test } from '@playwright/test'
import { login, makeTestUser, registerAndLogin, signOut } from './helpers/auth'

test.describe('Authentication', () => {
  test('redirects unauthenticated users from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: /^Sign in$/ })).toBeVisible()
  })

  test('register → dashboard → sign out → log back in', async ({ page }) => {
    const user = await registerAndLogin(page)

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    // Email shows up inside the user-menu dropdown.
    const menuTrigger = page.locator('header button[aria-haspopup="menu"]').first()
    await menuTrigger.click()
    await expect(page.getByRole('menu').getByText(user.email)).toBeVisible()
    // Close the menu before signOut() reopens it (menu trigger toggles).
    await menuTrigger.click()

    await signOut(page)
    await expect(page.getByRole('heading', { name: /^Sign in$/ })).toBeVisible()

    await login(page, user)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('login with wrong password shows an error', async ({ page }) => {
    const user = makeTestUser()
    await registerAndLogin(page, user)
    await signOut(page)

    await page.goto('/login')
    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('Password', { exact: true }).fill('wrong-password-9999')
    await page.getByRole('button', { name: /^Sign in$/ }).click()

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })
})
