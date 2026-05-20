import type { Page } from '@playwright/test'

export type Insight = { title: string; body: string }

const DEFAULT_INSIGHTS: Insight[] = [
  {
    title: 'Spending concentrated in Food',
    body: 'Food accounts for the largest expense share this month — consider a weekly cap.',
  },
  {
    title: 'Income exceeds expenses',
    body: 'You ended the month net positive. Earmark the surplus toward savings.',
  },
  {
    title: 'Transport stayed flat',
    body: 'Transport costs held steady versus your recent baseline — no action needed.',
  },
]

type MockOptions = {
  insights?: Insight[]
  month?: string
  status?: number
  error?: { code: string; message: string }
}

export async function mockInsightsResponse(page: Page, opts: MockOptions = {}): Promise<void> {
  const status = opts.status ?? 200
  await page.route('**/api/insights*', async (route) => {
    if (status >= 400) {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({
          error: opts.error ?? { code: 'AI_PROVIDER_ERROR', message: 'Unable to generate insights' },
        }),
      })
      return
    }
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({
        insights: opts.insights ?? DEFAULT_INSIGHTS,
        month: opts.month ?? new Date().toISOString().slice(0, 7),
      }),
    })
  })
}
