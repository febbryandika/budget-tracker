import { toast } from 'sonner'
import { anyDirty } from './dirty-forms'
import { queryClient } from './query-client'

let fired = false

export function handleSessionExpired() {
  if (fired) return
  const path = window.location.pathname
  if (path.startsWith('/login') || path.startsWith('/register')) return

  if (anyDirty() && !window.confirm('You have unsaved changes. Continue to login?')) {
    // User chose to stay — preserve form values and allow a later 401 to retrigger.
    return
  }

  fired = true
  toast.error('Your session expired. Please sign in again.')
  queryClient.clear()
  queueMicrotask(() => window.location.assign('/login'))
}

export function resetSessionExpiredForTests() {
  fired = false
}
