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
  const invalidate = useInvalidateEntries()
  return useMutation({
    mutationFn: async (input: CreateInput) => {
      const res = await client.api.entries.$post({ json: input })
      if (!res.ok) throw new Error('Failed to create entry')
      return res.json()
    },
    onSuccess: invalidate,
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

type DeleteSnapshot = Array<[readonly unknown[], EntryRow[] | undefined]>

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
      const snapshot = qc.getQueriesData<EntryRow[]>({ queryKey: ['entries'] })
      for (const [key, rows] of snapshot) {
        if (!rows) continue
        qc.setQueryData<EntryRow[]>(key, rows.filter((r) => r.id !== id))
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
