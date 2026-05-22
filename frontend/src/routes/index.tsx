import { createFileRoute, redirect } from '@tanstack/react-router'
import { LandingPage } from '@/components/landing/landing-page'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const { data } = await authClient.getSession()
    if (data?.session) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LandingPage,
})
