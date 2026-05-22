import { createRootRouteWithContext, Outlet, useRouter, useRouterState } from '@tanstack/react-router'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'
import { Toaster } from 'sonner'
import { TopNav } from '@/components/app/top-nav'
import { ErrorFallback } from '@/components/error-fallback'
import { authClient, useSession } from '@/lib/auth-client'
import { captureException } from '@/lib/sentry'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

const PUBLIC_ROUTES = ['/', '/login']

function RootLayout() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  async function handleSignOut() {
    await authClient.signOut()
    queryClient.clear()
    router.navigate({ to: '/login' })
  }

  // Decide chrome by path, not by session-data. Session may briefly toggle on
  // refresh, and route guards already ensure /dashboard etc. are auth-only.
  const isPublic = PUBLIC_ROUTES.includes(pathname)
  const showShell = !isPublic

  return (
    <div className={showShell ? 'app-shell' : undefined}>
      {showShell && (
        <TopNav
          userName={session?.user.name ?? ''}
          userEmail={session?.user.email ?? ''}
          userRole={session?.user.role ?? null}
          onSignOut={handleSignOut}
        />
      )}
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => queryClient.clear()}
        onError={(err, info) =>
          captureException(err, { componentStack: info.componentStack })
        }
      >
        {showShell ? (
          <main className="app-container" style={{ paddingTop: 28, paddingBottom: 60, flex: 1 }}>
            <Outlet />
          </main>
        ) : (
          <Outlet />
        )}
      </ErrorBoundary>
      <Toaster richColors position="top-right" />
    </div>
  )
}
