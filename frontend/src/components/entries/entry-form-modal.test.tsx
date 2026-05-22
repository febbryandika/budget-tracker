import type { ReactNode } from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EntryFormModal, type Category } from './entry-form-modal'

const postFn = vi.fn()
const putFn = vi.fn()
vi.mock('@/lib/client', () => ({
  client: {
    api: {
      entries: Object.assign(
        { $post: (...a: unknown[]) => postFn(...a) },
        {
          ':id': {
            $put: (...a: unknown[]) => putFn(...a),
          },
        },
      ),
    },
  },
}))

const categories: Category[] = [
  { id: 'cat-food', name: 'Food',   color: '#f97316', icon: 'utensils',  type: 'expense' },
  { id: 'cat-salary', name: 'Salary', color: '#10b981', icon: 'briefcase', type: 'income' },
]

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

beforeEach(() => {
  postFn.mockReset()
  putFn.mockReset()
})

describe('EntryFormModal', () => {
  it('renders the new-entry modal with Add entry submit label', () => {
    render(<EntryFormModal entry={null} categories={categories} onClose={() => {}} />, { wrapper })
    expect(screen.getByRole('heading', { name: 'New entry' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add entry/ })).toBeInTheDocument()
  })

  it('renders the edit modal with prefilled values and Save changes label', () => {
    render(
      <EntryFormModal
        entry={{
          id: 'e1',
          type: 'income',
          amount: 1500000,
          categoryId: 'cat-salary',
          date: '2026-05-01',
          note: 'Paycheck',
        }}
        categories={categories}
        onClose={() => {}}
      />,
      { wrapper },
    )
    expect(screen.getByRole('heading', { name: 'Edit entry' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Save changes/ })).toBeInTheDocument()
    const amount = screen.getByLabelText('Amount') as HTMLInputElement
    expect(amount.value).toBe('1500000')
    const note = screen.getByLabelText(/^Note/) as HTMLInputElement
    expect(note.value).toBe('Paycheck')
  })

  it('rejects a non-positive amount', async () => {
    const user = userEvent.setup()
    render(<EntryFormModal entry={null} categories={categories} onClose={() => {}} />, { wrapper })
    await user.type(screen.getByLabelText('Amount'), '0')
    await user.click(screen.getByRole('button', { name: /Add entry/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/positive amount/i)
    expect(postFn).not.toHaveBeenCalled()
  })

  it('toggles between income and expense categories', async () => {
    const user = userEvent.setup()
    render(<EntryFormModal entry={null} categories={categories} onClose={() => {}} />, { wrapper })
    // Defaults to expense → Food is visible
    expect(screen.getByRole('radio', { name: /Food/ })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: /Salary/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Income' }))
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /Salary/ })).toBeInTheDocument()
    })
  })
})
