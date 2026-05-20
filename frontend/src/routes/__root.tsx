import { createRootRouteWithContext, Link, Outlet, useRouter } from '@tanstack/react-router'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'
import { Toaster } from 'sonner'
import { ErrorFallback } from '@/components/error-fallback'
import { authClient, useSession } from '@/lib/auth-client'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session, isPending } = useSession()

  async function handleSignOut() {
    await authClient.signOut()
    router.navigate({ to: '/login' })
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center gap-4 border-b px-6 py-3">
        <Link
          to={session ? '/dashboard' : '/login'}
          className="font-semibold text-foreground hover:text-primary"
        >
          Budget Tracker
        </Link>

        {session && (
          <div className="flex items-center gap-3 text-sm">
            <Link
              to="/dashboard"
              activeProps={{ className: 'text-foreground' }}
              className="text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              to="/entries"
              activeProps={{ className: 'text-foreground' }}
              className="text-muted-foreground hover:text-foreground"
            >
              Entries
            </Link>
            <Link
              to="/categories"
              activeProps={{ className: 'text-foreground' }}
              className="text-muted-foreground hover:text-foreground"
            >
              Categories
            </Link>
          </div>
        )}

        <div className="ml-auto flex items-center gap-4 text-sm">
          {isPending ? null : session ? (
            <>
              <span className="text-muted-foreground">{session.user.email}</span>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-md border px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login" className="text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
          )}
        </div>
      </nav>
      <main className="container mx-auto px-6 py-8">
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onReset={() => queryClient.clear()}
        >
          <Outlet />
        </ErrorBoundary>
      </main>
      <Toaster richColors position="top-right" />
    </div>
  )
}
