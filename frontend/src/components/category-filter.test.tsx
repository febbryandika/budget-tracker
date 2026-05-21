import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryFilter } from './category-filter'

const categories = [
  { id: 'cat-food', name: 'Food' },
  { id: 'cat-transport', name: 'Transport' },
]

describe('CategoryFilter', () => {
  it('renders an All-categories option and one per category, with current value selected', () => {
    render(<CategoryFilter categories={categories} value="cat-food" onChange={() => {}} />)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('cat-food')
    expect(screen.getByRole('option', { name: 'All categories' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Food' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Transport' })).toBeInTheDocument()
  })

  it('treats undefined value as the All-categories selection', () => {
    render(<CategoryFilter categories={categories} value={undefined} onChange={() => {}} />)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('')
  })

  it('calls onChange with the chosen category id', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CategoryFilter categories={categories} value={undefined} onChange={onChange} />)
    await user.selectOptions(screen.getByRole('combobox'), 'cat-transport')
    expect(onChange).toHaveBeenCalledWith('cat-transport')
  })

  it('calls onChange with undefined when All categories is chosen', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CategoryFilter categories={categories} value="cat-food" onChange={onChange} />)
    await user.selectOptions(screen.getByRole('combobox'), '')
    expect(onChange).toHaveBeenCalledWith(undefined)
  })
})
