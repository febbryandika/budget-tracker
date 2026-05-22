import { useMutation, useQueryClient } from '@tanstack/react-query'
import { client } from '@/lib/client'

type CreateInput = {
  name: string
  color: string
  icon?: string
  type?: 'income' | 'expense'
}
type UpdateInput = { id: string; patch: Partial<CreateInput> }

type Category = {
  id: string
  name: string
  color: string
  icon: string
  type: 'income' | 'expense'
  isDefault: string
}

export class CategoryInUseError extends Error {
  readonly code = 'CATEGORY_IN_USE'
  constructor(message: string) {
    super(message)
    this.name = 'CategoryInUseError'
  }
}

function useInvalidateCategories() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['categories'] })
    qc.invalidateQueries({ queryKey: ['insights'], refetchType: 'none' })
  }
}

export function useCreateCategory() {
  const invalidate = useInvalidateCategories()
  return useMutation({
    mutationFn: async (input: CreateInput) => {
      const res = await client.api.categories.$post({ json: input })
      if (!res.ok) throw new Error('Failed to create category')
      return res.json()
    },
    onSuccess: invalidate,
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, UpdateInput, { prev?: Category[] }>({
    mutationFn: async ({ id, patch }) => {
      const res = await client.api.categories[':id'].$put({
        param: { id },
        json: patch,
      })
      if (!res.ok) throw new Error('Failed to update category')
      return res.json()
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ['categories'] })
      const prev = qc.getQueryData<Category[]>(['categories'])
      if (prev) {
        qc.setQueryData<Category[]>(
          ['categories'],
          prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        )
      }
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['categories'], ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['insights'], refetchType: 'none' })
    },
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, { id: string }, { prev?: Category[] }>({
    mutationFn: async ({ id }) => {
      const res = await client.api.categories[':id'].$delete({ param: { id } })
      if (res.status === 409) {
        const body = (await res.json()) as { error?: { code?: string; message?: string } }
        const message = body.error?.message ?? 'Cannot delete category with entries'
        throw new CategoryInUseError(message)
      }
      if (!res.ok) throw new Error('Failed to delete category')
      return res.json()
    },
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ['categories'] })
      const prev = qc.getQueryData<Category[]>(['categories'])
      if (prev) {
        qc.setQueryData<Category[]>(['categories'], prev.filter((c) => c.id !== id))
      }
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['categories'], ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['insights'], refetchType: 'none' })
    },
  })
}
