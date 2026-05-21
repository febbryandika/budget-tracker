import type { ReactNode } from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const putFn = vi.fn()
const deleteFn = vi.fn()

vi.mock('@/lib/client', () => ({
  client: {
    api: {
      categories: {
        ':id': {
          $put: (...a: unknown[]) => putFn(...a),
          $delete: (...a: unknown[]) => deleteFn(...a),
        },
      },
    },
  },
}))

import {
  CategoryInUseError,
  useDeleteCategory,
  useUpdateCategory,
} from './use-category-mutations'

type Category = { id: string; name: string; color: string; isDefault: string }

const catA: Category = { id: 'c-a', name: 'Food', color: '#ff0000', isDefault: 'true' }
const catB: Category = { id: 'c-b', name: 'Travel', color: '#00ffff', isDefault: 'false' }

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function wrapperFor(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

describe('useUpdateCategory', () => {
  beforeEach(() => {
    putFn.mockReset()
    deleteFn.mockReset()
  })

  it('optimistically patches the cache and rolls back on failure', async () => {
    const qc = makeClient()
    qc.setQueryData<Category[]>(['categories'], [catA, catB])

    let reject: (e: Error) => void = () => {}
    putFn.mockReturnValue(
      new Promise((_r, rej) => {
        reject = rej
      }),
    )

    const { result } = renderHook(() => useUpdateCategory(), { wrapper: wrapperFor(qc) })

    act(() => {
      result.current.mutate({ id: 'c-a', patch: { name: 'Snacks' } })
    })

    await waitFor(() => {
      const cached = qc.getQueryData<Category[]>(['categories'])
      expect(cached?.find((c) => c.id === 'c-a')?.name).toBe('Snacks')
    })

    reject(new Error('server down'))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(qc.getQueryData<Category[]>(['categories'])).toEqual([catA, catB])
  })
})

describe('useDeleteCategory', () => {
  beforeEach(() => {
    putFn.mockReset()
    deleteFn.mockReset()
  })

  it('throws CategoryInUseError when the server returns a 409', async () => {
    const qc = makeClient()
    qc.setQueryData<Category[]>(['categories'], [catA, catB])

    deleteFn.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        error: { code: 'CATEGORY_IN_USE', message: 'Cannot delete category with entries' },
      }),
    })

    const { result } = renderHook(() => useDeleteCategory(), { wrapper: wrapperFor(qc) })

    await expect(result.current.mutateAsync({ id: 'c-a' })).rejects.toBeInstanceOf(
      CategoryInUseError,
    )
    // Optimistic remove should also have been rolled back.
    await waitFor(() => {
      expect(qc.getQueryData<Category[]>(['categories'])).toEqual([catA, catB])
    })
  })

  it('rolls back the optimistic removal on generic failure', async () => {
    const qc = makeClient()
    qc.setQueryData<Category[]>(['categories'], [catA, catB])

    deleteFn.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })

    const { result } = renderHook(() => useDeleteCategory(), { wrapper: wrapperFor(qc) })

    act(() => {
      result.current.mutate({ id: 'c-a' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(qc.getQueryData<Category[]>(['categories'])).toEqual([catA, catB])
  })

  it('removes the category optimistically before the request resolves on success', async () => {
    const qc = makeClient()
    qc.setQueryData<Category[]>(['categories'], [catA, catB])

    let resolve: (v: { ok: true; status: 200; json: () => Promise<unknown> }) => void = () => {}
    deleteFn.mockReturnValue(
      new Promise((r) => {
        resolve = r as typeof resolve
      }),
    )

    const { result } = renderHook(() => useDeleteCategory(), { wrapper: wrapperFor(qc) })

    act(() => {
      result.current.mutate({ id: 'c-a' })
    })

    await waitFor(() => {
      expect(qc.getQueryData<Category[]>(['categories'])).toEqual([catB])
    })

    resolve({ ok: true, status: 200, json: async () => ({}) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
