import { expect, test } from '@playwright/test'
import { registerAndLogin } from './helpers/auth'
import { createEntry } from './helpers/entries'
import { mockInsightsResponse } from './helpers/mock-ai'

test.describe('AI insights', () => {
  test('renders 3 insight cards on success', async ({ page }) => {
    await registerAndLogin(page)
    await createEntry(page, { type: 'expense', amount: 30000, category: 'Food', note: 'Snacks' })

    await mockInsightsResponse(page)

    await page.goto('/dashboard')
    const button = page.getByRole('button', { name: /Get AI insights/ })
    await expect(button).toBeEnabled()

    await button.click()

    await expect(page.getByText('Spending concentrated in Food')).toBeVisible()
    await expect(page.getByText('Income exceeds expenses')).toBeVisible()
    await expect(page.getByText('Transport stayed flat')).toBeVisible()
  })

  test('shows a non-blocking error and keeps the dashboard usable on 502', async ({ page }) => {
    await registerAndLogin(page)
    await createEntry(page, { type: 'expense', amount: 30000, category: 'Food', note: 'Snacks' })

    await mockInsightsResponse(page, { status: 502 })

    await page.goto('/dashboard')
    await page.getByRole('button', { name: /Get AI insights/ }).click()

    await expect(page.getByText('Unable to generate insights right now.')).toBeVisible()

    // Dashboard summary is still intact.
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText('Total Income')).toBeVisible()
  })
})
