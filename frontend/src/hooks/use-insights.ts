import { useQuery } from '@tanstack/react-query'
import { client } from '@/lib/client'

type Insight = { title: string; body: string }
type InsightsResponse = {
  insights: Insight[]
  month: string
  message?: string
}

export function useInsights(month: string) {
  return useQuery<InsightsResponse>({
    queryKey: ['insights', month],
    queryFn: async () => {
      const res = await client.api.insights.$get({ query: { month } })
      if (!res.ok) throw new Error('Failed to generate insights')
      const data = (await res.json()) as InsightsResponse | { error: unknown }
      if ('error' in data) throw new Error('Failed to generate insights')
      return data
    },
    enabled: false,
    retry: false,
    staleTime: Infinity,
  })
}
