// Process-local counters. For multi-instance/Workers deployment, swap for a
// shared store (KV, Redis) or a metrics backend (StatsD, OpenTelemetry).

type Metrics = {
  startedAt: number
  aiInsightsRequested: number
  aiInsightsSucceeded: number
  aiInsightsFailed: number
  aiDurationMsTotal: number
  apiErrorsByStatus: Record<number, number>
}

const metrics: Metrics = {
  startedAt: Date.now(),
  aiInsightsRequested: 0,
  aiInsightsSucceeded: 0,
  aiInsightsFailed: 0,
  aiDurationMsTotal: 0,
  apiErrorsByStatus: {},
}

export function recordAiInsight(outcome: 'success' | 'failure', durationMs: number) {
  metrics.aiInsightsRequested += 1
  if (outcome === 'success') metrics.aiInsightsSucceeded += 1
  else metrics.aiInsightsFailed += 1
  metrics.aiDurationMsTotal += durationMs
}

export function recordApiError(status: number) {
  metrics.apiErrorsByStatus[status] = (metrics.apiErrorsByStatus[status] ?? 0) + 1
}

export function snapshot() {
  const totalCompleted = metrics.aiInsightsSucceeded + metrics.aiInsightsFailed
  const avgAiDurationMs = totalCompleted === 0 ? 0 : Math.round(metrics.aiDurationMsTotal / totalCompleted)
  const totalErrors = Object.values(metrics.apiErrorsByStatus).reduce((s, n) => s + n, 0)
  return {
    uptimeSeconds: Math.round((Date.now() - metrics.startedAt) / 1000),
    ai: {
      requested: metrics.aiInsightsRequested,
      succeeded: metrics.aiInsightsSucceeded,
      failed: metrics.aiInsightsFailed,
      avgDurationMs: avgAiDurationMs,
    },
    errors: {
      total: totalErrors,
      byStatus: metrics.apiErrorsByStatus,
    },
  }
}
