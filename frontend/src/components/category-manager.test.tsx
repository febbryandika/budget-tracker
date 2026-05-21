import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const toastError = vi.fn()
const toastSuccess = vi.fn()
vi.mock('sonner', () => ({
  toast: { error: (...a: unknown[]) => toastError(...a), success: (...a: unknown[]) => toastSuccess(...a) },
}))

const createMutateAsync = vi.fn()
const updateMutateAsync = vi.fn()
const deleteMutateAsync = vi.fn()
const deleteState: { isPending: boolean; variables?: { id: string } } = { isPending: false }

vi.mock('@/hooks/use-category-mutations', async () => {
  class CategoryInUseError extends Error {
    readonly code = 'CATEGORY_IN_USE'
    constructor(message: string) {
      super(message)
      this.name = 'CategoryInUseError'
    }
  }
  return {
    CategoryInUseError,
    useCreateCategory: () => ({
      mutateAsync: createMutateAsync,
      isPending: false,
    }),
    useUpdateCategory: () => ({
      mutateAsync: updateMutateAsync,
      isPending: false,
    }),
    useDeleteCategory: () => ({
      mutateAsync: deleteMutateAsync,
      isPending: deleteState.isPending,
      variables: deleteState.variables,
    }),
  }
})

import { CategoryManager } from './category-manager'
import { CategoryInUseError } from '@/hooks/use-category-mutations'

const categories = [
  { id: 'c-food', name: 'Food', color: '#ff0000', isDefault: 'true' },
  { id: 'c-travel', name: 'Travel', color: '#00ffff', isDefault: 'false' },
]

describe('CategoryManager', () => {
  beforeEach(() => {
    createMutateAsync.mockReset()
    updateMutateAsync.mockReset()
    deleteMutateAsync.mockReset()
    toastError.mockReset()
    toastSuccess.mockReset()
    deleteState.isPending = false
    deleteState.variables = undefined
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders one item per category and marks defaults with a badge', () => {
    render(<CategoryManager categories={categories} />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)

    const foodRow = screen.getByText('Food').closest('li')!
    expect(within(foodRow).getByText('Default')).toBeInTheDocument()

    const travelRow = screen.getByText('Travel').closest('li')!
    expect(within(travelRow).queryByText('Default')).toBeNull()
  })

  it('ignores submit when the new category name is blank/whitespace', async () => {
    const user = userEvent.setup()
    render(<CategoryManager categories={categories} />)
    const nameInput = screen.getByLabelText('New category')
    await user.type(nameInput, '   ')
    // Bypass HTML5 required on whitespace by submitting via the form directly.
    const form = nameInput.closest('form')!
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    expect(createMutateAsync).not.toHaveBeenCalled()
  })

  it('creates a category, clears the input, and shows a success toast on success', async () => {
    const user = userEvent.setup()
    createMutateAsync.mockResolvedValue({})
    render(<CategoryManager categories={categories} />)
    const nameInput = screen.getByLabelText('New category') as HTMLInputElement
    await user.type(nameInput, 'Groceries')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(createMutateAsync).toHaveBeenCalledWith({ name: 'Groceries', color: '#6366f1' })
    expect(toastSuccess).toHaveBeenCalledWith('Category added')
    expect(nameInput.value).toBe('')
  })

  it('shows an error toast and retains the input value on create failure', async () => {
    const user = userEvent.setup()
    createMutateAsync.mockRejectedValue(new Error('boom'))
    render(<CategoryManager categories={categories} />)
    const nameInput = screen.getByLabelText('New category') as HTMLInputElement
    await user.type(nameInput, 'Groceries')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(toastError).toHaveBeenCalledWith('Failed to create category. Please try again.')
    expect(nameInput.value).toBe('Groceries')
  })

  it('blocks save and renders an alert when the edited name is blank', async () => {
    const user = userEvent.setup()
    render(<CategoryManager categories={categories} />)
    const travelRow = screen.getByText('Travel').closest('li')!
    await user.click(within(travelRow).getByRole('button', { name: 'Edit' }))
    const nameField = within(travelRow).getByLabelText('Category name') as HTMLInputElement
    await user.clear(nameField)
    // Native required: drive save via the Save button click — but with empty value
    // the required attribute would block. Bypass by setting via fireEvent — easier:
    // We can't easily bypass here, so directly invoke the Save flow by typing a space
    // (whitespace) which passes required but trims to empty in handleSave.
    await user.type(nameField, ' ')
    await user.click(within(travelRow).getByRole('button', { name: 'Save' }))

    const alert = await within(travelRow).findByRole('alert')
    expect(alert.textContent).toMatch(/name is required/i)
    expect(updateMutateAsync).not.toHaveBeenCalled()
  })

  it('updates a category and closes edit mode on success', async () => {
    const user = userEvent.setup()
    updateMutateAsync.mockResolvedValue({})
    render(<CategoryManager categories={categories} />)
    const travelRow = screen.getByText('Travel').closest('li')!
    await user.click(within(travelRow).getByRole('button', { name: 'Edit' }))
    const nameField = within(travelRow).getByLabelText('Category name')
    await user.clear(nameField)
    await user.type(nameField, 'Trips')
    await user.click(within(travelRow).getByRole('button', { name: 'Save' }))

    expect(updateMutateAsync).toHaveBeenCalledWith({
      id: 'c-travel',
      patch: { name: 'Trips', color: '#00ffff' },
    })
    expect(toastSuccess).toHaveBeenCalledWith('Category updated')
    // Edit mode closes: Save button no longer present in the row.
    expect(within(travelRow).queryByRole('button', { name: 'Save' })).toBeNull()
  })

  it('renders the CategoryInUseError message inline on that row instead of a toast', async () => {
    const user = userEvent.setup()
    deleteMutateAsync.mockRejectedValue(new CategoryInUseError('Cannot delete category with entries'))
    render(<CategoryManager categories={categories} />)
    const foodRow = screen.getByText('Food').closest('li')!
    await user.click(within(foodRow).getByRole('button', { name: 'Delete' }))

    const alert = await within(foodRow).findByRole('alert')
    expect(alert.textContent).toMatch(/cannot delete category with entries/i)
    expect(toastError).not.toHaveBeenCalled()
  })

  it('shows a generic error toast for non-CategoryInUseError delete failures', async () => {
    const user = userEvent.setup()
    deleteMutateAsync.mockRejectedValue(new Error('server down'))
    render(<CategoryManager categories={categories} />)
    const foodRow = screen.getByText('Food').closest('li')!
    await user.click(within(foodRow).getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Failed to delete category. Please try again.')
    })
  })

  it('toasts success when delete resolves', async () => {
    const user = userEvent.setup()
    deleteMutateAsync.mockResolvedValue({})
    render(<CategoryManager categories={categories} />)
    const foodRow = screen.getByText('Food').closest('li')!
    await user.click(within(foodRow).getByRole('button', { name: 'Delete' }))
    expect(deleteMutateAsync).toHaveBeenCalledWith({ id: 'c-food' })
    expect(toastSuccess).toHaveBeenCalledWith('Category deleted')
  })
})
