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

type InfiniteEntries = { pages: EntryRow[][]; pageParams: number[] }

describe('useDeleteEntry', () => {
  beforeEach(() => {
    deleteFn.mockReset()
    postFn.mockReset()
  })

  it('optimistically removes the row from every entries cache before the request settles', async () => {
    const qc = makeClient()
    const keyA = ['entries', { month: '2026-05', categoryId: null }] as const
    const keyB = ['entries', { month: '2026-05', categoryId: 'c-food' }] as const
    qc.setQueryData<InfiniteEntries>([...keyA], { pages: [[row1, row2]], pageParams: [0] })
    qc.setQueryData<InfiniteEntries>([...keyB], { pages: [[row1, row2]], pageParams: [0] })

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
      expect(qc.getQueryData<InfiniteEntries>([...keyA])!.pages).toEqual([[row2]])
      expect(qc.getQueryData<InfiniteEntries>([...keyB])!.pages).toEqual([[row2]])
    })

    resolve({ ok: true, json: async () => ({}) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('rolls back the cache to its pre-mutation snapshot when the request fails', async () => {
    const qc = makeClient()
    const key = ['entries', { month: '2026-05', categoryId: null }] as const
    const initial: InfiniteEntries = { pages: [[row1, row2]], pageParams: [0] }
    qc.setQueryData<InfiniteEntries>([...key], initial)

    deleteFn.mockResolvedValue({ ok: false })

    const { result } = renderHook(() => useDeleteEntry(), { wrapper: wrapperFor(qc) })

    act(() => {
      result.current.mutate({ id: 'e1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(qc.getQueryData<InfiniteEntries>([...key])).toEqual(initial)
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

  it('optimistically prepends to matching month/category caches and swaps in the server row on success', async () => {
    const qc = makeClient()
    const matchKey = ['entries', { month: '2026-05', categoryId: null }] as const
    const wrongMonthKey = ['entries', { month: '2026-04', categoryId: null }] as const
    const wrongCategoryKey = ['entries', { month: '2026-05', categoryId: 'c-other' }] as const

    qc.setQueryData<InfiniteEntries>([...matchKey], { pages: [[row1]], pageParams: [0] })
    qc.setQueryData<InfiniteEntries>([...wrongMonthKey], { pages: [[row1]], pageParams: [0] })
    qc.setQueryData<InfiniteEntries>([...wrongCategoryKey], { pages: [[row1]], pageParams: [0] })

    let resolve: (v: { ok: true; json: () => Promise<EntryRow> }) => void = () => {}
    postFn.mockReturnValue(
      new Promise((r) => {
        resolve = r as typeof resolve
      }),
    )

    const { result } = renderHook(() => useCreateEntry(), { wrapper: wrapperFor(qc) })

    act(() => {
      result.current.mutate({
        amount: 7,
        type: 'expense',
        categoryId: 'c-food',
        date: '2026-05-21',
        note: 'lunch',
      })
    })

    await waitFor(() => {
      const data = qc.getQueryData<InfiniteEntries>([...matchKey])!
      expect(data.pages[0]).toHaveLength(2)
      expect(data.pages[0]![0]!.id).toMatch(/^optimistic-/)
      expect(data.pages[0]![0]!.amount).toBe('7')
    })

    expect(qc.getQueryData<InfiniteEntries>([...wrongMonthKey])).toEqual({ pages: [[row1]], pageParams: [0] })
    expect(qc.getQueryData<InfiniteEntries>([...wrongCategoryKey])).toEqual({ pages: [[row1]], pageParams: [0] })

    const real: EntryRow = {
      id: 'real-id',
      categoryId: 'c-food',
      type: 'expense',
      amount: '7.00',
      date: '2026-05-21',
      note: 'lunch',
    }
    resolve({ ok: true, json: async () => real })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const swapped = qc.getQueryData<InfiniteEntries>([...matchKey])!
    expect(swapped.pages[0]![0]).toEqual(real)
  })

  it('rolls back the optimistic prepend when the request fails', async () => {
    const qc = makeClient()
    const key = ['entries', { month: '2026-05', categoryId: null }] as const
    const initial: InfiniteEntries = { pages: [[row1, row2]], pageParams: [0] }
    qc.setQueryData<InfiniteEntries>([...key], initial)

    postFn.mockResolvedValue({ ok: false })

    const { result } = renderHook(() => useCreateEntry(), { wrapper: wrapperFor(qc) })

    act(() => {
      result.current.mutate({ amount: 5, type: 'expense', date: '2026-05-20' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(qc.getQueryData<InfiniteEntries>([...key])).toEqual(initial)
  })
})
