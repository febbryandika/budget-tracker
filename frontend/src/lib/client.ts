import { hc } from 'hono/client'
import type { AppType } from '../../../backend/src/index'
import { handleSessionExpired } from './session-expired'

// Hono RPC client — fully type-safe
// AppType is inferred from the backend router
function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  return input.url
}

const wrappedFetch: typeof fetch = async (input, init) => {
  const res = await fetch(input, { ...init, credentials: 'include' })
  if (res.status === 401) {
    const url = requestUrl(input)
    if (url.includes('/api/') && !url.includes('/api/auth/')) {
      handleSessionExpired()
    }
  }
  return res
}

export const client = hc<AppType>(import.meta.env.VITE_API_URL ?? 'http://localhost:3000', {
  fetch: wrappedFetch,
})
