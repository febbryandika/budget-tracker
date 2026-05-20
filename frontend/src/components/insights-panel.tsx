import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useInsights } from '@/hooks/use-insights'

type Props = {
  month: string
  disabled?: boolean
}

export function InsightsPanel({ month, disabled }: Props) {
  const { data, refetch, isFetching, error } = useInsights(month)
  const lastErrorRef = useRef<unknown>(null)

  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      lastErrorRef.current = error
      toast.error('Unable to generate insights right now.')
    }
  }, [error])

  const insights = data?.insights ?? []
  const emptyMessage = data?.message

  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">AI insights</h2>
          <p className="text-sm text-muted-foreground">
            Get 3 specific takeaways from this month's spending.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={disabled || isFetching}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isFetching ? 'Analyzing…' : 'Get AI insights'}
        </button>
      </div>

      {emptyMessage && insights.length === 0 && !error && (
        <p className="mt-4 text-sm text-muted-foreground">{emptyMessage}</p>
      )}

      {insights.length > 0 && (
        <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {insights.map((insight, i) => (
            <li key={i} className="rounded-md border bg-background p-4">
              <p className="text-sm font-semibold">{insight.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{insight.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
