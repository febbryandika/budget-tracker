import { expect, test } from '@playwright/test'
import { registerAndLogin } from './helpers/auth'
import { createEntry } from './helpers/entries'

function categoryRow(page: import('@playwright/test').Page, name: string) {
  return page.getByRole('listitem').filter({ has: page.getByText(name, { exact: true }) })
}

test.describe('Category management', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page)
  })

  test('seeds default categories on first visit', async ({ page }) => {
    await page.goto('/categories')
    for (const name of ['Food', 'Transport', 'Utilities', 'Salary', 'Entertainment', 'Other']) {
      await expect(categoryRow(page, name)).toBeVisible()
    }
  })

  test('create, rename, and delete a custom category', async ({ page }) => {
    await page.goto('/categories')

    // Create
    await page.getByLabel('New category', { exact: true }).fill('Travel')
    await page.getByRole('button', { name: 'Add' }).click()
    await expect(page.getByText('Category added')).toBeVisible()
    await expect(categoryRow(page, 'Travel')).toBeVisible()

    // Rename
    await categoryRow(page, 'Travel').getByRole('button', { name: 'Edit' }).click()
    await page.getByLabel('Category name').fill('Vacations')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Category updated')).toBeVisible()
    await expect(categoryRow(page, 'Vacations')).toBeVisible()

    // Delete
    page.once('dialog', (dialog) => dialog.accept())
    await categoryRow(page, 'Vacations').getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Category deleted')).toBeVisible()
    await expect(categoryRow(page, 'Vacations')).toHaveCount(0)
  })

  test('blocks deleting a category referenced by an entry', async ({ page }) => {
    await createEntry(page, { type: 'expense', amount: 12, category: 'Food', note: 'Lunch' })

    await page.goto('/categories')
    const foodRow = categoryRow(page, 'Food')
    await expect(foodRow).toBeVisible()

    page.once('dialog', (dialog) => dialog.accept())
    await foodRow.getByRole('button', { name: 'Delete' }).click()

    await expect(foodRow.getByRole('alert')).toContainText(/in use|referenced|cannot/i)
    await expect(foodRow).toBeVisible()
  })
})
