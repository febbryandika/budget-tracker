import { expect, type Page } from '@playwright/test'

export type EntryInput = {
  type: 'income' | 'expense'
  amount: number
  category?: string
  date?: string
  note?: string
}

export async function createEntry(page: Page, entry: EntryInput): Promise<void> {
  await page.goto('/entries')
  // Wait for categories to load (their chips appear in the filter bar) so the
  // modal opens with a stable category list and the type buttons don't shift.
  await expect(page.getByRole('button', { name: 'All categories' })).toBeVisible()
  await page.getByRole('button', { name: /^New entry$/ }).click()
  const dialog = page.getByRole('dialog', { name: /New entry/ })
  await expect(dialog).toBeVisible()
  await page.waitForTimeout(300)
  await dialog.locator(`[data-testid="entry-type-${entry.type}"]`).click({ force: true })
  await dialog.getByLabel('Amount').fill(String(entry.amount))
  if (entry.category) {
    await dialog.getByRole('radio', { name: new RegExp(`^${entry.category}$`) }).click()
  }
  if (entry.date) {
    await dialog.getByLabel('Date').fill(entry.date)
  }
  if (entry.note) {
    await dialog.getByLabel(/^Note/).fill(entry.note)
  }
  await dialog.getByRole('button', { name: /Add entry/ }).click()
  await expect(dialog).toBeHidden()
}
