import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const useUnsavedChangesMock = vi.fn()
vi.mock('@/hooks/use-unsaved-changes', () => ({
  useUnsavedChanges: (...args: unknown[]) => useUnsavedChangesMock(...args),
}))

import { EntryForm } from './entry-form'

const categories = [
  { id: 'cat-food', name: 'Food', color: '#ff0000' },
  { id: 'cat-salary', name: 'Salary', color: '#00ff00' },
]

describe('EntryForm', () => {
  beforeEach(() => {
    useUnsavedChangesMock.mockReset()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders initial values in edit mode and shows the Save changes label', () => {
    render(
      <EntryForm
        mode="edit"
        categories={categories}
        initialValues={{
          amount: '25.00',
          type: 'income',
          categoryId: 'cat-salary',
          date: '2026-05-10',
          note: 'Bonus',
        }}
        onSubmit={() => {}}
      />,
    )
    expect((screen.getByLabelText('Amount') as HTMLInputElement).value).toBe('25.00')
    expect((screen.getByLabelText('Category') as HTMLSelectElement).value).toBe('cat-salary')
    expect((screen.getByLabelText('Date') as HTMLInputElement).value).toBe('2026-05-10')
    expect((screen.getByLabelText(/Note/) as HTMLTextAreaElement).value).toBe('Bonus')
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
  })

  it('shows the Add entry label in create mode', () => {
    render(<EntryForm mode="create" categories={categories} onSubmit={() => {}} />)
    expect(screen.getByRole('button', { name: 'Add entry' })).toBeInTheDocument()
  })

  it('toggling Income changes form state so submit sends type=income', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<EntryForm mode="create" categories={categories} onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Income' }))
    await user.type(screen.getByLabelText('Amount'), '50')
    await user.click(screen.getByRole('button', { name: 'Add entry' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ type: 'income', amount: 50 })
  })

  it('blocks submit and renders an alert when amount is zero', async () => {
    const onSubmit = vi.fn()
    render(
      <EntryForm
        mode="create"
        categories={categories}
        initialValues={{ amount: '0' }}
        onSubmit={onSubmit}
      />,
    )
    // Bypass native HTML5 validation (min=0.01) so the JS validation branch runs.
    const form = screen.getByRole('button', { name: 'Add entry' }).closest('form')!
    fireEvent.submit(form)

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toMatch(/positive number/i)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('omits categoryId and note from the submit payload when empty', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<EntryForm mode="create" categories={categories} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Amount'), '7.25')
    await user.clear(screen.getByLabelText('Date'))
    await user.type(screen.getByLabelText('Date'), '2026-05-20')
    await user.click(screen.getByRole('button', { name: 'Add entry' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const payload = onSubmit.mock.calls[0][0]
    expect(payload).toEqual({
      amount: 7.25,
      type: 'expense',
      date: '2026-05-20',
      categoryId: undefined,
      note: undefined,
    })
  })

  it('disables submit and cancel and switches label while submitting', () => {
    render(
      <EntryForm
        mode="edit"
        categories={categories}
        onSubmit={() => {}}
        onCancel={() => {}}
        submitting
      />,
    )
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })

  it('calls useUnsavedChanges with false on first render and true after editing', async () => {
    const user = userEvent.setup()
    render(<EntryForm mode="create" categories={categories} onSubmit={() => {}} />)
    // First call comes from the very first render — nothing dirty yet.
    expect(useUnsavedChangesMock).toHaveBeenCalledWith(false)
    await user.type(screen.getByLabelText('Amount'), '1')
    // After typing, at least one render passes dirty && !submitting === true.
    expect(useUnsavedChangesMock.mock.calls.some((c) => c[0] === true)).toBe(true)
  })
})
