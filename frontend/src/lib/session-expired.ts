import { toast } from 'sonner'
import { queryClient } from './query-client'

let fired = false

export function handleSessionExpired() {
  if (fired) return
  const path = window.location.pathname
  if (path.startsWith('/login') || path.startsWith('/register')) return

  fired = true
  toast.error('Your session expired. Please sign in again.')
  queryClient.clear()
  queueMicrotask(() => window.location.assign('/login'))
}

export function resetSessionExpiredForTests() {
  fired = false
}
