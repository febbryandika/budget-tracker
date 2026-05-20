import { useQuery } from '@tanstack/react-query'
import { client } from '@/lib/client'

export function useEntry(id: string) {
  return useQuery({
    queryKey: ['entry', id],
    queryFn: async () => {
      const res = await client.api.entries[':id'].$get({ param: { id } })
      if (res.status === 404) throw new Error('Entry not found')
      if (!res.ok) throw new Error('Failed to load entry')
      const data = await res.json()
      if ('error' in data) throw new Error('Entry not found')
      return data
    },
    retry: false,
  })
}
