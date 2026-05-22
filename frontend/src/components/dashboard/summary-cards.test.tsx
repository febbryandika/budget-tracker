import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SummaryCards } from './summary-cards'

const trend = [
  { month: '2026-04', income: 10_000_000, expense: 6_000_000, net: 4_000_000 },
  { month: '2026-05', income: 14_000_000, expense: 5_750_000, net: 8_250_000 },
]

describe('SummaryCards', () => {
  it('renders three cards with IDR-formatted totals', () => {
    render(
      <SummaryCards
        income={14_000_000}
        expense={5_750_000}
        net={8_250_000}
        trend={trend}
      />,
    )
    expect(screen.getByText('Total Income')).toBeInTheDocument()
    expect(screen.getByText('Total Expenses')).toBeInTheDocument()
    expect(screen.getByText('Net Balance')).toBeInTheDocument()
    expect(screen.getByText(/Rp\s*14\.000\.000/)).toBeInTheDocument()
    expect(screen.getByText(/Rp\s*8\.250\.000/)).toBeInTheDocument()
  })

  it('shows percent deltas computed from the previous month in the trend', () => {
    render(
      <SummaryCards
        income={14_000_000}
        expense={5_750_000}
        net={8_250_000}
        trend={trend}
      />,
    )
    // (14M - 10M) / 10M = +40%
    expect(screen.getByText(/\+40\.0% vs last month/)).toBeInTheDocument()
  })

  it('shows shimmer placeholders while loading', () => {
    const { container } = render(
      <SummaryCards income={0} expense={0} net={0} trend={[]} loading />,
    )
    expect(container.querySelectorAll('.shimmer').length).toBeGreaterThan(0)
  })
})
