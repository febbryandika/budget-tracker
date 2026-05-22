import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EntryTable, type CategoryInfo, type EntryRow } from './entry-table'

const categoryMap = new Map<string, CategoryInfo>([
  ['cat-food', { name: 'Food', color: '#f97316', icon: 'utensils' }],
])

const entries: EntryRow[] = [
  { id: 'e1', categoryId: 'cat-food', type: 'expense', amount: '12500', date: '2026-05-12', note: 'Lunch' },
  { id: 'e2', categoryId: null, type: 'income', amount: '1500000', date: '2026-05-01', note: null },
]

describe('EntryTable', () => {
  it('renders rows with formatted amounts (IDR by default)', () => {
    render(
      <EntryTable
        entries={entries}
        categoryMap={categoryMap}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    )
    expect(screen.getByText('Lunch')).toBeInTheDocument()
    expect(screen.getByText(/−Rp\s*12\.500/)).toBeInTheDocument()
    expect(screen.getByText(/\+Rp\s*1\.500\.000/)).toBeInTheDocument()
  })

  it('shows Uncategorized for entries without a category', () => {
    render(
      <EntryTable
        entries={entries}
        categoryMap={categoryMap}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    )
    expect(screen.getByText('Uncategorized')).toBeInTheDocument()
  })

  it('calls onEdit when the Edit action is clicked', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(
      <EntryTable
        entries={entries}
        categoryMap={categoryMap}
        onEdit={onEdit}
        onDelete={() => {}}
      />,
    )
    const editButtons = screen.getAllByRole('button', { name: 'Edit' })
    await user.click(editButtons[0])
    expect(onEdit).toHaveBeenCalledWith(entries[0])
  })

  it('calls onDelete when the Delete action is clicked', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(
      <EntryTable
        entries={entries}
        categoryMap={categoryMap}
        onEdit={() => {}}
        onDelete={onDelete}
      />,
    )
    const delButtons = screen.getAllByRole('button', { name: 'Delete' })
    await user.click(delButtons[0])
    expect(onDelete).toHaveBeenCalledWith('e1')
  })
})
