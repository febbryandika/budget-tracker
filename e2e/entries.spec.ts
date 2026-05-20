import { expect, test } from '@playwright/test'
import { registerAndLogin } from './helpers/auth'
import { createEntry } from './helpers/entries'

test.describe('Entries CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page)
  })

  test('create an expense and see it on the list', async ({ page }) => {
    await createEntry(page, {
      type: 'expense',
      amount: 42.5,
      category: 'Food',
      note: 'Groceries',
    })

    const row = page.getByRole('row', { name: /Groceries/ })
    await expect(row).toBeVisible()
    await expect(row.getByText(/Food/)).toBeVisible()
    await expect(row.getByText(/Expense/)).toBeVisible()
    await expect(row.getByText('−$42.50')).toBeVisible()
  })

  test('create an income then edit its amount', async ({ page }) => {
    await createEntry(page, { type: 'income', amount: 1000, category: 'Salary', note: 'Paycheck' })

    await page.getByRole('row', { name: /Paycheck/ }).getByRole('link', { name: 'Edit' }).click()
    await expect(page.getByRole('heading', { name: 'Edit entry' })).toBeVisible()

    await page.getByLabel('Amount').fill('1500')
    await page.getByRole('button', { name: 'Save changes' }).click()

    await expect(page).toHaveURL(/\/entries$/)
    await expect(page.getByRole('row', { name: /Paycheck/ }).getByText('+$1,500.00')).toBeVisible()
  })

  test('delete an entry through the confirm dialog', async ({ page }) => {
    await createEntry(page, { type: 'expense', amount: 9.99, note: 'Coffee' })

    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('row', { name: /Coffee/ }).getByRole('button', { name: 'Delete' }).click()

    await expect(page.getByText('Entry deleted')).toBeVisible()
    await expect(page.getByRole('row', { name: /Coffee/ })).toHaveCount(0)
  })

  test('filter entries by category', async ({ page }) => {
    await createEntry(page, { type: 'expense', amount: 10, category: 'Food', note: 'Lunch' })
    await createEntry(page, { type: 'expense', amount: 20, category: 'Transport', note: 'Bus' })

    await page.getByLabel('Category').selectOption({ label: 'Food' })

    await expect(page.getByRole('row', { name: /Lunch/ })).toBeVisible()
    await expect(page.getByRole('row', { name: /Bus/ })).toHaveCount(0)

    await page.getByLabel('Category').selectOption({ label: 'All categories' })
    await expect(page.getByRole('row', { name: /Bus/ })).toBeVisible()
  })
})
