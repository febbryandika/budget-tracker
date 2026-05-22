import type { ReactNode } from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const getFn = vi.fn()
vi.mock('@/lib/client', () => ({
  client: {
    api: {
      insights: {
        $get: (...a: unknown[]) => getFn(...a),
      },
    },
  },
}))

import { InsightsPanel } from './insights-panel'

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

beforeEach(() => {
  getFn.mockReset()
})

describe('InsightsPanel', () => {
  it('renders the idle CTA panel with a Get AI insights button', () => {
    render(<InsightsPanel month="2026-05" />, { wrapper })
    expect(screen.getByRole('heading', { name: /Get AI insights/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Get AI insights/ })).toBeInTheDocument()
  })

  it('disables the button when there are no entries', () => {
    render(<InsightsPanel month="2026-05" disabled />, { wrapper })
    expect(screen.getByRole('button', { name: /Get AI insights/ })).toBeDisabled()
  })
})
