import { expect, test } from '@playwright/test'
import { registerAndLogin } from './helpers/auth'
import { createEntry } from './helpers/entries'

test.describe('Dashboard', () => {
  test('shows empty state for a brand-new user', async ({ page }) => {
    await registerAndLogin(page)
    await page.goto('/dashboard')

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText('Total income', { exact: true })).toBeVisible()
    await expect(page.getByText('Total expenses', { exact: true })).toBeVisible()
    await expect(page.getByText('Net balance', { exact: true })).toBeVisible()

    await expect(page.getByText('No data to chart yet')).toBeVisible()
    await expect(page.getByText('Add your first entry to see monthly insights.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Get AI insights' })).toBeDisabled()
  })

  test('reflects totals and renders the chart after entries are added', async ({ page }) => {
    await registerAndLogin(page)
    await createEntry(page, { type: 'income', amount: 2000, category: 'Salary', note: 'Paycheck' })
    await createEntry(page, { type: 'expense', amount: 500, category: 'Food', note: 'Groceries' })

    await page.goto('/dashboard')

    await expect(page.getByText('$2,000.00')).toBeVisible()
    await expect(page.getByText('$500.00')).toBeVisible()
    await expect(page.getByText('$1,500.00')).toBeVisible()

    await expect(page.getByRole('application')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Get AI insights' })).toBeEnabled()
  })

  test('month picker updates the visible summary', async ({ page }) => {
    await registerAndLogin(page)
    await createEntry(page, { type: 'income', amount: 100, category: 'Salary' })

    await page.goto('/dashboard')

    // MonthPicker is the only <select> on this page; pick an older option.
    const monthSelect = page.locator('select').first()
    await expect(monthSelect).toBeVisible()
    const optionValues = await monthSelect.locator('option').evaluateAll((nodes) =>
      nodes.map((n) => (n as HTMLOptionElement).value),
    )
    expect(optionValues.length).toBeGreaterThan(2)
    await monthSelect.selectOption(optionValues[2])

    await expect(page.getByText('No data to chart yet')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Get AI insights' })).toBeDisabled()
  })
})
