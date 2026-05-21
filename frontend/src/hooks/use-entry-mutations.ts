import { useMutation, useQueryClient } from '@tanstack/react-query'
import { client } from '@/lib/client'

type CreateInput = {
  amount: number
  type: 'income' | 'expense'
  categoryId?: string
  date: string
  note?: string
}

type UpdateInput = {
  id: string
  patch: Partial<CreateInput>
}

type EntryRow = {
  id: string
  categoryId: string | null
  type: 'income' | 'expense'
  amount: string
  date: string
  note: string | null
}

type EntriesInfiniteData = { pages: EntryRow[][]; pageParams: number[] }
type EntriesFilter = { month: string; categoryId: string | null }
type CreateSnapshot = Array<[readonly unknown[], EntriesInfiniteData | undefined]>

function useInvalidateEntries() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['entries'] })
    qc.invalidateQueries({ queryKey: ['summary'] })
    qc.invalidateQueries({ queryKey: ['entry'] })
    qc.invalidateQueries({ queryKey: ['insights'], refetchType: 'none' })
  }
}

export function useCreateEntry() {
  const qc = useQueryClient()
  return useMutation<EntryRow, Error, CreateInput, { snapshot: CreateSnapshot; tempId: string }>({
    mutationFn: async (input) => {
      const res = await client.api.entries.$post({ json: input })
      if (!res.ok) throw new Error('Failed to create entry')
      return (await res.json()) as EntryRow
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['entries'] })

      const tempId = `optimistic-${crypto.randomUUID()}`
      const optimistic: EntryRow = {
        id: tempId,
        categoryId: input.categoryId ?? null,
        type: input.type,
        amount: String(input.amount),
        date: input.date,
        note: input.note ?? null,
      }
      const month = input.date.slice(0, 7)

      const snapshot = qc.getQueriesData<EntriesInfiniteData>({ queryKey: ['entries'] })
      for (const [key, data] of snapshot) {
        if (!data) continue
        const filters = (key as readonly unknown[])[1] as EntriesFilter | undefined
        if (!filters || filters.month !== month) continue
        if (filters.categoryId && filters.categoryId !== optimistic.categoryId) continue

        const firstPage = data.pages[0] ?? []
        const pages = [[optimistic, ...firstPage], ...data.pages.slice(1)]
        qc.setQueryData<EntriesInfiniteData>(key, { ...data, pages })
      }

      return { snapshot, tempId }
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return
      for (const [key, prev] of ctx.snapshot) {
        qc.setQueryData(key, prev)
      }
    },
    onSuccess: (real, _input, ctx) => {
      if (!ctx) return
      const caches = qc.getQueriesData<EntriesInfiniteData>({ queryKey: ['entries'] })
      for (const [key, data] of caches) {
        if (!data) continue
        const pages = data.pages.map((page) =>
          page.map((row) => (row.id === ctx.tempId ? real : row)),
        )
        qc.setQueryData<EntriesInfiniteData>(key, { ...data, pages })
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['entries'] })
      qc.invalidateQueries({ queryKey: ['summary'] })
      qc.invalidateQueries({ queryKey: ['insights'], refetchType: 'none' })
    },
  })
}

export function useUpdateEntry() {
  const invalidate = useInvalidateEntries()
  return useMutation({
    mutationFn: async ({ id, patch }: UpdateInput) => {
      const res = await client.api.entries[':id'].$put({
        param: { id },
        json: patch,
      })
      if (!res.ok) throw new Error('Failed to update entry')
      return res.json()
    },
    onSuccess: invalidate,
  })
}

type DeleteSnapshot = Array<[readonly unknown[], EntriesInfiniteData | undefined]>

export function useDeleteEntry() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, { id: string }, { snapshot: DeleteSnapshot }>({
    mutationFn: async ({ id }) => {
      const res = await client.api.entries[':id'].$delete({ param: { id } })
      if (!res.ok) throw new Error('Failed to delete entry')
      return res.json()
    },
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ['entries'] })
      const snapshot = qc.getQueriesData<EntriesInfiniteData>({ queryKey: ['entries'] })
      for (const [key, data] of snapshot) {
        if (!data) continue
        const pages = data.pages.map((page) => page.filter((row) => row.id !== id))
        qc.setQueryData<EntriesInfiniteData>(key, { ...data, pages })
      }
      return { snapshot }
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return
      for (const [key, prev] of ctx.snapshot) {
        qc.setQueryData(key, prev)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['entries'] })
      qc.invalidateQueries({ queryKey: ['summary'] })
      qc.invalidateQueries({ queryKey: ['insights'], refetchType: 'none' })
    },
  })
}
