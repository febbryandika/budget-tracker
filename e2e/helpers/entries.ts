import { expect, type Page } from '@playwright/test'

export type EntryInput = {
  type: 'income' | 'expense'
  amount: number
  category?: string
  date?: string
  note?: string
}

export async function createEntry(page: Page, entry: EntryInput): Promise<void> {
  await page.goto('/entries/new')
  await page.getByRole('button', { name: entry.type === 'income' ? 'Income' : 'Expense' }).click()
  await page.getByLabel('Amount').fill(String(entry.amount))
  if (entry.category) {
    await page.getByLabel('Category').selectOption({ label: entry.category })
  }
  if (entry.date) {
    await page.getByLabel('Date').fill(entry.date)
  }
  if (entry.note) {
    await page.getByLabel(/^Note/).fill(entry.note)
  }
  await page.getByRole('button', { name: 'Add entry' }).click()
  await expect(page).toHaveURL(/\/entries$/)
}
