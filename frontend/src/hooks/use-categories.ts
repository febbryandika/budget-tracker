import { useQuery } from '@tanstack/react-query'
import { client } from '@/lib/client'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await client.api.categories.$get()
      if (!res.ok) throw new Error('Failed to load categories')
      return res.json()
    },
    staleTime: 5 * 60_000,
  })
}
