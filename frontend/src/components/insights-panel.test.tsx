import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const toastError = vi.fn()
const toastSuccess = vi.fn()
vi.mock('sonner', () => ({
  toast: { error: (...a: unknown[]) => toastError(...a), success: (...a: unknown[]) => toastSuccess(...a) },
}))

type InsightsState = {
  data?: { insights: Array<{ title: string; body: string }>; month: string; message?: string }
  error?: unknown
  isFetching?: boolean
  refetch?: () => void
}

const insightsState: InsightsState = {}
vi.mock('@/hooks/use-insights', () => ({
  useInsights: () => ({
    data: insightsState.data,
    error: insightsState.error,
    isFetching: insightsState.isFetching ?? false,
    refetch: insightsState.refetch ?? (() => {}),
  }),
}))

import { InsightsPanel } from './insights-panel'

function setInsights(state: InsightsState) {
  insightsState.data = state.data
  insightsState.error = state.error
  insightsState.isFetching = state.isFetching
  insightsState.refetch = state.refetch
}

describe('InsightsPanel', () => {
  beforeEach(() => {
    toastError.mockReset()
    toastSuccess.mockReset()
    setInsights({})
  })

  it('shows the default button label and is enabled when idle', () => {
    setInsights({})
    render(<InsightsPanel month="2026-05" />)
    const btn = screen.getByRole('button', { name: 'Get AI insights' })
    expect(btn).not.toBeDisabled()
  })

  it('switches the label to "Analyzing…" and disables the button while fetching', () => {
    setInsights({ isFetching: true })
    render(<InsightsPanel month="2026-05" />)
    expect(screen.getByRole('button', { name: 'Analyzing…' })).toBeDisabled()
  })

  it('disables the button when the disabled prop is true even if not fetching', () => {
    setInsights({})
    render(<InsightsPanel month="2026-05" disabled />)
    expect(screen.getByRole('button', { name: 'Get AI insights' })).toBeDisabled()
  })

  it('calls refetch once when the button is clicked', async () => {
    const refetch = vi.fn()
    setInsights({ refetch })
    const user = userEvent.setup()
    render(<InsightsPanel month="2026-05" />)
    await user.click(screen.getByRole('button', { name: 'Get AI insights' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('renders three insight cards with title + body when data is present', () => {
    setInsights({
      data: {
        month: '2026-05',
        insights: [
          { title: 'Coffee runs', body: 'You spent $80 on coffee.' },
          { title: 'Salary stable', body: 'Income matches last month.' },
          { title: 'Save more', body: 'Try cutting transport by 10%.' },
        ],
      },
    })
    render(<InsightsPanel month="2026-05" />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(screen.getByText('Coffee runs')).toBeInTheDocument()
    expect(screen.getByText('Save more')).toBeInTheDocument()
  })

  it('renders the empty message when insights array is empty', () => {
    setInsights({
      data: { month: '2026-05', insights: [], message: 'Add your first entry to see monthly insights.' },
    })
    render(<InsightsPanel month="2026-05" />)
    expect(
      screen.getByText('Add your first entry to see monthly insights.'),
    ).toBeInTheDocument()
  })

  it('fires the error toast once per distinct error, even across re-renders', () => {
    const error = new Error('boom')
    setInsights({ error })
    const { rerender } = render(<InsightsPanel month="2026-05" />)
    rerender(<InsightsPanel month="2026-05" />)
    rerender(<InsightsPanel month="2026-05" />)
    expect(toastError).toHaveBeenCalledTimes(1)
    expect(toastError).toHaveBeenCalledWith('Unable to generate insights right now.')
  })
})
