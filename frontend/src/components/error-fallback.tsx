import type { FallbackProps } from 'react-error-boundary'
import { Link } from '@tanstack/react-router'

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback
}

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div
      role="alert"
      className="mx-auto my-12 max-w-md space-y-4 rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm"
    >
      <div>
        <p className="font-semibold text-destructive">Something went wrong.</p>
        <p className="mt-1 text-muted-foreground">{errorMessage(error, 'An unexpected error occurred.')}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={resetErrorBoundary}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
        <Link
          to="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}

export function InlineErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div
      role="alert"
      className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm"
    >
      <p className="font-medium text-destructive">This section failed to render.</p>
      <p className="text-muted-foreground">{errorMessage(error, 'Unexpected error.')}</p>
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
      >
        Try again
      </button>
    </div>
  )
}
