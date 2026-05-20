import { useQuery } from '@tanstack/react-query'
import { client } from '@/lib/client'

export function useEntries(month: string, categoryId?: string) {
  return useQuery({
    queryKey: ['entries', { month, categoryId: categoryId ?? null }],
    queryFn: async () => {
      const res = await client.api.entries.$get({
        query: { month, ...(categoryId ? { categoryId } : {}) },
      })
      if (!res.ok) throw new Error('Failed to load entries')
      return res.json()
    },
  })
}
