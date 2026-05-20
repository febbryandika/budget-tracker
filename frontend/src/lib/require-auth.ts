import { redirect } from '@tanstack/react-router'
import { authClient } from './auth-client'

export async function requireAuth() {
  const { data } = await authClient.getSession()
  if (!data?.session) {
    throw redirect({ to: '/login' })
  }
  return data
}

export async function redirectIfAuthed() {
  const { data } = await authClient.getSession()
  if (data?.session) {
    throw redirect({ to: '/dashboard' })
  }
}
