import type { ReactNode } from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CategoryManager, type CategoryRow } from './category-manager'

vi.mock('@/lib/client', () => ({
  client: {
    api: {
      categories: Object.assign(
        { $post: vi.fn() },
        {
          ':id': {
            $put: vi.fn(),
            $delete: vi.fn(),
          },
        },
      ),
    },
  },
}))

const categories: CategoryRow[] = [
  { id: 'c1', name: 'Food',     color: '#f97316', icon: 'utensils',  type: 'expense', isDefault: 'true' },
  { id: 'c2', name: 'Salary',   color: '#10b981', icon: 'briefcase', type: 'income',  isDefault: 'true' },
  { id: 'c3', name: 'Travel',   color: '#6366f1', icon: 'tag',       type: 'expense', isDefault: 'false' },
]

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

beforeEach(() => {
  // silence the unsaved-changes hook etc.
})

describe('CategoryManager', () => {
  it('splits categories into Expense and Income groups', () => {
    render(<CategoryManager categories={categories} entries={[]} />, { wrapper })
    expect(screen.getByText('Expense categories')).toBeInTheDocument()
    expect(screen.getByText('Income categories')).toBeInTheDocument()
    const expenseGroup = screen.getByText('Expense categories').closest('.card')!
    expect(expenseGroup).toContainElement(screen.getByText('Food'))
    expect(expenseGroup).toContainElement(screen.getByText('Travel'))
    const incomeGroup = screen.getByText('Income categories').closest('.card')!
    expect(incomeGroup).toContainElement(screen.getByText('Salary'))
  })

  it('marks default-seeded categories with a "Default" badge', () => {
    render(<CategoryManager categories={categories} entries={[]} />, { wrapper })
    // Food row has Default badge; Travel does not
    const foodRow = screen.getByText('Food').closest('li')!
    expect(foodRow).toHaveTextContent('Default')
    const travelRow = screen.getByText('Travel').closest('li')!
    expect(travelRow).not.toHaveTextContent('Default')
  })

  it('reports per-category usage from the entries prop', () => {
    render(
      <CategoryManager
        categories={categories}
        entries={[{ categoryId: 'c1' }, { categoryId: 'c1' }, { categoryId: 'c3' }]}
      />,
      { wrapper },
    )
    const foodRow = screen.getByText('Food').closest('li')!
    expect(foodRow).toHaveTextContent('2 entries use this')
    const travelRow = screen.getByText('Travel').closest('li')!
    expect(travelRow).toHaveTextContent('1 entry use this')
  })

  it('opens the editor modal when New category is clicked', async () => {
    const user = userEvent.setup()
    render(<CategoryManager categories={categories} entries={[]} />, { wrapper })
    await user.click(screen.getByRole('button', { name: 'New category' }))
    expect(screen.getByRole('dialog', { name: 'New category' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create category/ })).toBeInTheDocument()
  })

  it('opens the editor modal in edit mode when Edit is clicked on a row', async () => {
    const user = userEvent.setup()
    render(<CategoryManager categories={categories} entries={[]} />, { wrapper })
    const travelRow = screen.getByText('Travel').closest('li')!
    const editButton = travelRow.querySelector('button[aria-label="Edit"]')!
    await user.click(editButton as HTMLElement)
    expect(screen.getByRole('dialog', { name: 'Edit category' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Save changes/ })).toBeInTheDocument()
  })
})
