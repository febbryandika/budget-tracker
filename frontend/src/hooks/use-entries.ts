import { useInfiniteQuery } from '@tanstack/react-query'
import { client } from '@/lib/client'

export const ENTRIES_PAGE_SIZE = 500

export function useEntries(month: string, categoryId?: string) {
  return useInfiniteQuery({
    queryKey: ['entries', { month, categoryId: categoryId ?? null }],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const res = await client.api.entries.$get({
        query: {
          month,
          ...(categoryId ? { categoryId } : {}),
          limit: String(ENTRIES_PAGE_SIZE),
          offset: String(pageParam),
        },
      })
      if (!res.ok) throw new Error('Failed to load entries')
      return res.json()
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < ENTRIES_PAGE_SIZE ? undefined : allPages.length * ENTRIES_PAGE_SIZE,
  })
}
