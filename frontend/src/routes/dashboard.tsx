import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { InlineErrorFallback } from '@/components/error-fallback'
import { InsightsPanel } from '@/components/insights-panel'
import { MonthChart } from '@/components/month-chart'
import { MonthPicker } from '@/components/month-picker'
import { SummaryCards } from '@/components/summary-cards'
import { useSummary } from '@/hooks/use-summary'
import { requireAuth } from '@/lib/require-auth'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: requireAuth,
  component: DashboardPage,
})

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

function DashboardPage() {
  const [month, setMonth] = useState(currentMonth)
  const { data, isLoading, isError, refetch } = useSummary(month)

  const totalIncome = data?.totalIncome ?? 0
  const totalExpense = data?.totalExpense ?? 0
  const net = data?.net ?? 0
  const trend = data?.trend ?? []
  const hasEntries = totalIncome !== 0 || totalExpense !== 0

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Track your income, expenses, and net balance.
          </p>
        </div>
        <MonthPicker value={month} onChange={setMonth} />
      </header>

      {isError ? (
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive">Failed to load summary.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 text-sm underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <SummaryCards
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            net={net}
            loading={isLoading}
          />
          <ErrorBoundary FallbackComponent={InlineErrorFallback}>
            <MonthChart data={trend} />
          </ErrorBoundary>
          <ErrorBoundary FallbackComponent={InlineErrorFallback}>
            <InsightsPanel month={month} disabled={!hasEntries} />
          </ErrorBoundary>
          {!isLoading && !hasEntries && (
            <p className="text-center text-sm text-muted-foreground">
              Add your first entry to see monthly insights.
            </p>
          )}
        </>
      )}
    </div>
  )
}
