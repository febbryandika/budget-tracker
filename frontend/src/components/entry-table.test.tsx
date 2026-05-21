import type { ReactNode } from 'react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    params,
    ...rest
  }: {
    children: ReactNode
    to: string
    params?: Record<string, string>
    [key: string]: unknown
  }) => {
    const href = params
      ? Object.entries(params).reduce((acc, [k, v]) => acc.replace(`$${k}`, v), to)
      : to
    return (
      <a href={href} data-to={to} {...rest}>
        {children}
      </a>
    )
  },
}))

import { EntryTable } from './entry-table'

const categoryMap = new Map([
  ['cat-food', { name: 'Food', color: '#ff0000' }],
  ['cat-salary', { name: 'Salary', color: '#00ff00' }],
])

const entries = [
  {
    id: 'e1',
    categoryId: 'cat-food',
    type: 'expense' as const,
    amount: '12.50',
    date: '2026-05-15',
    note: 'Lunch',
  },
  {
    id: 'e2',
    categoryId: 'cat-salary',
    type: 'income' as const,
    amount: '1000.00',
    date: '2026-05-01',
    note: null,
  },
  {
    id: 'e3',
    categoryId: null,
    type: 'expense' as const,
    amount: '5.00',
    date: '2026-05-10',
    note: 'Misc',
  },
]

describe('EntryTable', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders one row per entry with formatted amount, type label, and category name', () => {
    render(<EntryTable entries={entries} categoryMap={categoryMap} onDelete={() => {}} />)
    const rows = screen.getAllByRole('row')
    // 1 header row + 3 data rows
    expect(rows).toHaveLength(4)

    const lunchRow = screen.getByText('Lunch').closest('tr')!
    expect(within(lunchRow).getByText('Expense')).toBeInTheDocument()
    expect(within(lunchRow).getByText('Food')).toBeInTheDocument()
    expect(within(lunchRow).getByText(/−\$12\.50/)).toBeInTheDocument()

    const salaryRow = screen.getByText('Salary').closest('tr')!
    expect(within(salaryRow).getByText('Income')).toBeInTheDocument()
    expect(within(salaryRow).getByText(/\+\$1,000\.00/)).toBeInTheDocument()
  })

  it('renders "—" when the entry has no category', () => {
    render(<EntryTable entries={entries} categoryMap={categoryMap} onDelete={() => {}} />)
    const miscRow = screen.getByText('Misc').closest('tr')!
    expect(within(miscRow).getByText('—')).toBeInTheDocument()
  })

  it('calls onDelete when the user confirms', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<EntryTable entries={entries} categoryMap={categoryMap} onDelete={onDelete} />)
    const lunchRow = screen.getByText('Lunch').closest('tr')!
    await user.click(within(lunchRow).getByRole('button', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledWith('e1')
  })

  it('does not call onDelete when the user cancels the confirm prompt', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const onDelete = vi.fn()
    render(<EntryTable entries={entries} categoryMap={categoryMap} onDelete={onDelete} />)
    const lunchRow = screen.getByText('Lunch').closest('tr')!
    await user.click(within(lunchRow).getByRole('button', { name: 'Delete' }))
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('disables the matching Delete button and shows "Deleting…" when deletingId matches', () => {
    render(
      <EntryTable
        entries={entries}
        categoryMap={categoryMap}
        onDelete={() => {}}
        deletingId="e1"
      />,
    )
    const lunchRow = screen.getByText('Lunch').closest('tr')!
    const deletingBtn = within(lunchRow).getByRole('button', { name: 'Deleting…' })
    expect(deletingBtn).toBeDisabled()

    const salaryRow = screen.getByText('Salary').closest('tr')!
    expect(within(salaryRow).getByRole('button', { name: 'Delete' })).not.toBeDisabled()
  })

  it('renders the Edit link with the correct id in its target', () => {
    render(<EntryTable entries={entries} categoryMap={categoryMap} onDelete={() => {}} />)
    const lunchRow = screen.getByText('Lunch').closest('tr')!
    const editLink = within(lunchRow).getByRole('link', { name: 'Edit' })
    expect(editLink.getAttribute('href')).toContain('e1')
    expect(editLink.getAttribute('data-to')).toBe('/entries/$id/edit')
  })
})
