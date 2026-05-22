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
      amount: 42500,
      category: 'Food',
      note: 'Groceries',
    })

    const row = page.getByRole('row', { name: /Groceries/ })
    await expect(row).toBeVisible()
    await expect(row.getByText('Food')).toBeVisible()
    await expect(row.getByText('Expense')).toBeVisible()
    await expect(row.getByText(/−Rp\s*42\.500/)).toBeVisible()
  })

  test('create an income then edit its amount', async ({ page }) => {
    await createEntry(page, { type: 'income', amount: 1000000, category: 'Salary', note: 'Paycheck' })

    const row = page.getByRole('row', { name: /Paycheck/ })
    await row.getByRole('button', { name: 'Edit' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit entry' })
    await expect(dialog).toBeVisible()

    await dialog.getByLabel('Amount').fill('1500000')
    await dialog.getByRole('button', { name: /Save changes/ }).click()

    await expect(dialog).toBeHidden()
    await expect(row.getByText(/\+Rp\s*1\.500\.000/)).toBeVisible()
  })

  test('delete an entry through the confirm dialog', async ({ page }) => {
    await createEntry(page, { type: 'expense', amount: 9999, note: 'Coffee' })

    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('row', { name: /Coffee/ }).getByRole('button', { name: 'Delete' }).click()

    await expect(page.getByText('Entry deleted')).toBeVisible()
    await expect(page.getByRole('row', { name: /Coffee/ })).toHaveCount(0)
  })

  test('filter entries by category', async ({ page }) => {
    await createEntry(page, { type: 'expense', amount: 10000, category: 'Food', note: 'Lunch' })
    await createEntry(page, { type: 'expense', amount: 20000, category: 'Transport', note: 'Bus' })

    // Click the Food category chip filter.
    await page.getByRole('button', { name: 'Food', exact: true }).first().click()

    await expect(page.getByRole('row', { name: /Lunch/ })).toBeVisible()
    await expect(page.getByRole('row', { name: /Bus/ })).toHaveCount(0)

    await page.getByRole('button', { name: 'All categories' }).click()
    await expect(page.getByRole('row', { name: /Bus/ })).toBeVisible()
  })
})
