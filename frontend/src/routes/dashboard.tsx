import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { CategoryBreakdown } from '@/components/dashboard/category-breakdown'
import { InsightsPanel } from '@/components/dashboard/insights-panel'
import { ChartFrame, MonthTrendChart } from '@/components/dashboard/month-trend-chart'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { EntryFormModal, type Category, type EntryDraft } from '@/components/entries/entry-form-modal'
import { InlineErrorFallback } from '@/components/error-fallback'
import { Plus } from 'lucide-react'
import { MonthPicker } from '@/components/month-picker'
import { useCategories } from '@/hooks/use-categories'
import { useEntries } from '@/hooks/use-entries'
import { useSummary } from '@/hooks/use-summary'
import { formatMonthLong } from '@/lib/format'
import { requireAuth } from '@/lib/require-auth'
import { captureException } from '@/lib/sentry'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: requireAuth,
  component: DashboardPage,
})

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

function DashboardPage() {
  const [month, setMonth] = useState(currentMonth)
  const [modalEntry, setModalEntry] = useState<EntryDraft | null>(null)
  const [showModal, setShowModal] = useState(false)

  const { data: summary, isLoading, isError, refetch } = useSummary(month)
  const { data: categoriesRaw } = useCategories()
  const { data: entriesData } = useEntries(month)

  const categories: Category[] = useMemo(
    () =>
      (categoriesRaw ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        icon: (c as { icon?: string }).icon ?? 'tag',
        type: ((c as { type?: 'income' | 'expense' }).type ?? 'expense'),
      })),
    [categoriesRaw],
  )

  const monthEntries = useMemo(() => entriesData?.pages.flat() ?? [], [entriesData])

  const totalIncome = summary?.totalIncome ?? 0
  const totalExpense = summary?.totalExpense ?? 0
  const net = summary?.net ?? 0
  const trend = summary?.trend ?? []
  const hasEntries = totalIncome !== 0 || totalExpense !== 0

  function openNew() {
    setModalEntry(null)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setModalEntry(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 className="t-display" style={{ fontSize: 28, marginBottom: 4 }}>Dashboard</h1>
          <p style={{ color: 'var(--fg-muted)', fontSize: 13.5 }}>
            Your snapshot for {formatMonthLong(month)}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <MonthPicker value={month} onChange={setMonth} />
          <button type="button" className="btn btn-primary" onClick={openNew}>
            <Plus size={15} /> New entry
          </button>
        </div>
      </header>

      {isError ? (
        <div
          role="alert"
          style={{
            padding: 16, borderRadius: 'var(--radius)',
            border: '1px solid color-mix(in oklch, var(--destructive) 40%, var(--border))',
            background: 'color-mix(in oklch, var(--destructive) 5%, transparent)',
          }}
        >
          <p style={{ color: 'var(--destructive)', fontWeight: 500, fontSize: 14 }}>Failed to load summary.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 8 }}
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <SummaryCards
            income={totalIncome}
            expense={totalExpense}
            net={net}
            trend={trend}
            loading={isLoading}
          />

          <ErrorBoundary
            FallbackComponent={InlineErrorFallback}
            onError={(err, info) =>
              captureException(err, { section: 'chart', componentStack: info.componentStack })
            }
          >
            <ChartFrame>
              <MonthTrendChart data={trend} />
            </ChartFrame>
          </ErrorBoundary>

          <ErrorBoundary
            FallbackComponent={InlineErrorFallback}
            onError={(err, info) =>
              captureException(err, { section: 'insights', componentStack: info.componentStack })
            }
          >
            <InsightsPanel month={month} disabled={!hasEntries} />
          </ErrorBoundary>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <CategoryBreakdown entries={monthEntries} categories={categories} month={month} />
            <RecentActivity entries={monthEntries} categories={categories} onAddEntry={openNew} />
          </div>
        </>
      )}

      {showModal && (
        <EntryFormModal
          entry={modalEntry}
          categories={categories}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
