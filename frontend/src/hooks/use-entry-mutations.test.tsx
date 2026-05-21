import type { ReactNode } from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const deleteFn = vi.fn()
const postFn = vi.fn()

vi.mock('@/lib/client', () => ({
  client: {
    api: {
      entries: Object.assign(
        { $post: (...a: unknown[]) => postFn(...a) },
        {
          ':id': {
            $delete: (...a: unknown[]) => deleteFn(...a),
          },
        },
      ),
    },
  },
}))

import { useCreateEntry, useDeleteEntry } from './use-entry-mutations'

type EntryRow = {
  id: string
  categoryId: string | null
  type: 'income' | 'expense'
  amount: string
  date: string
  note: string | null
}

const row1: EntryRow = {
  id: 'e1',
  categoryId: 'c-food',
  type: 'expense',
  amount: '10.00',
  date: '2026-05-15',
  note: null,
}
const row2: EntryRow = {
  id: 'e2',
  categoryId: 'c-food',
  type: 'expense',
  amount: '20.00',
  date: '2026-05-16',
  note: null,
}

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

describe('useDeleteEntry', () => {
  beforeEach(() => {
    deleteFn.mockReset()
    postFn.mockReset()
  })

  it('optimistically removes the row from every entries cache before the request settles', async () => {
    const qc = makeClient()
    const keyA = ['entries', { month: '2026-05' }] as const
    const keyB = ['entries', { month: '2026-05', categoryId: 'c-food' }] as const
    qc.setQueryData<EntryRow[]>([...keyA], [row1, row2])
    qc.setQueryData<EntryRow[]>([...keyB], [row1, row2])

    let resolve: (v: { ok: true; json: () => Promise<unknown> }) => void = () => {}
    deleteFn.mockReturnValue(
      new Promise((r) => {
        resolve = r as typeof resolve
      }),
    )

    const { result } = renderHook(() => useDeleteEntry(), { wrapper: wrapperFor(qc) })

    act(() => {
      result.current.mutate({ id: 'e1' })
    })

    await waitFor(() => {
      expect(qc.getQueryData<EntryRow[]>([...keyA])).toEqual([row2])
      expect(qc.getQueryData<EntryRow[]>([...keyB])).toEqual([row2])
    })

    resolve({ ok: true, json: async () => ({}) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('rolls back the cache to its pre-mutation snapshot when the request fails', async () => {
    const qc = makeClient()
    const key = ['entries', { month: '2026-05' }] as const
    qc.setQueryData<EntryRow[]>([...key], [row1, row2])

    deleteFn.mockResolvedValue({ ok: false })

    const { result } = renderHook(() => useDeleteEntry(), { wrapper: wrapperFor(qc) })

    act(() => {
      result.current.mutate({ id: 'e1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(qc.getQueryData<EntryRow[]>([...key])).toEqual([row1, row2])
  })
})

describe('useCreateEntry', () => {
  beforeEach(() => {
    deleteFn.mockReset()
    postFn.mockReset()
  })

  it('invalidates entries and summary queries on success', async () => {
    const qc = makeClient()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    postFn.mockResolvedValue({ ok: true, json: async () => ({ id: 'new' }) })

    const { result } = renderHook(() => useCreateEntry(), { wrapper: wrapperFor(qc) })

    await act(async () => {
      await result.current.mutateAsync({
        amount: 5,
        type: 'expense',
        date: '2026-05-20',
      })
    })

    const invalidatedKeys = invalidateSpy.mock.calls.map((c) => (c[0] as { queryKey: unknown[] }).queryKey[0])
    expect(invalidatedKeys).toEqual(expect.arrayContaining(['entries', 'summary']))
  })

  it('throws when the response is not ok', async () => {
    const qc = makeClient()
    postFn.mockResolvedValue({ ok: false })

    const { result } = renderHook(() => useCreateEntry(), { wrapper: wrapperFor(qc) })

    await expect(
      result.current.mutateAsync({ amount: 5, type: 'expense', date: '2026-05-20' }),
    ).rejects.toThrow(/Failed to create entry/)
  })
})
