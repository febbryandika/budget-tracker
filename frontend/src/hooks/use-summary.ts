import { useQuery } from '@tanstack/react-query'
import { client } from '@/lib/client'

export function useSummary(month: string) {
  return useQuery({
    queryKey: ['summary', month],
    queryFn: async () => {
      const res = await client.api.summary.$get({ query: { month } })
      if (!res.ok) throw new Error('Failed to load summary')
      return res.json()
    },
  })
}
