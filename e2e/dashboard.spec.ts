import { expect, test } from '@playwright/test'
import { registerAndLogin } from './helpers/auth'
import { createEntry } from './helpers/entries'

test.describe('Dashboard', () => {
  test('shows empty state for a brand-new user', async ({ page }) => {
    await registerAndLogin(page)
    await page.goto('/dashboard')

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText('Total Income', { exact: true })).toBeVisible()
    await expect(page.getByText('Total Expenses', { exact: true })).toBeVisible()
    await expect(page.getByText('Net Balance', { exact: true })).toBeVisible()

    await expect(page.getByText('No data to chart yet')).toBeVisible()
    await expect(page.getByRole('button', { name: /Get AI insights/ })).toBeDisabled()
  })

  test('reflects totals and renders the chart after entries are added', async ({ page }) => {
    await registerAndLogin(page)
    await createEntry(page, { type: 'income', amount: 2000, category: 'Salary', note: 'Paycheck' })
    await createEntry(page, { type: 'expense', amount: 500, category: 'Food', note: 'Groceries' })

    await page.goto('/dashboard')

    // IDR formatting: Rp 2.000 etc. (dot separator, no decimals)
    await expect(page.getByText(/Rp\s*2\.000/).first()).toBeVisible()
    await expect(page.getByText(/Rp\s*500/).first()).toBeVisible()
    await expect(page.getByText(/Rp\s*1\.500/).first()).toBeVisible()

    await expect(page.getByRole('application', { name: /trend/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Get AI insights/ })).toBeEnabled()
  })

  test('month picker updates the visible summary', async ({ page }) => {
    await registerAndLogin(page)
    await createEntry(page, { type: 'income', amount: 100, category: 'Salary' })

    await page.goto('/dashboard')

    const monthSelect = page.locator('#month-picker')
    await expect(monthSelect).toBeVisible()
    const optionValues = await monthSelect.locator('option').evaluateAll((nodes) =>
      nodes.map((n) => (n as HTMLOptionElement).value),
    )
    expect(optionValues.length).toBeGreaterThan(2)
    await monthSelect.selectOption(optionValues[2])

    await expect(page.getByText('No data to chart yet')).toBeVisible()
    await expect(page.getByRole('button', { name: /Get AI insights/ })).toBeDisabled()
  })
})
