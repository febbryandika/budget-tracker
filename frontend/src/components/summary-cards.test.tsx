import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SummaryCards } from './summary-cards'

describe('SummaryCards', () => {
  it('renders all three labels with formatted currency', () => {
    render(<SummaryCards totalIncome={1234.5} totalExpense={400} net={834.5} />)

    expect(screen.getByText('Total income')).toBeInTheDocument()
    expect(screen.getByText('Total expenses')).toBeInTheDocument()
    expect(screen.getByText('Net balance')).toBeInTheDocument()
    expect(screen.getByText(/\$1,234\.50/)).toBeInTheDocument()
    expect(screen.getByText(/\$400\.00/)).toBeInTheDocument()
    expect(screen.getByText(/\$834\.50/)).toBeInTheDocument()
  })

  it('shows skeleton placeholders when loading', () => {
    const { container } = render(
      <SummaryCards totalIncome={0} totalExpense={0} net={0} loading />,
    )
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(3)
    expect(screen.queryByText(/\$/)).toBeNull()
  })

  it('uses negative tone class when net is negative', () => {
    const { container } = render(
      <SummaryCards totalIncome={100} totalExpense={300} net={-200} />,
    )
    expect(container.textContent).toMatch(/-\$200\.00|\(\$200\.00\)/)
  })
})
