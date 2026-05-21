import { redis } from './redis'
import { captureException } from './sentry'

// When UPSTASH_REDIS_REST_URL + TOKEN are set, counters live in Redis and are
// consistent across instances/restarts. Otherwise we keep an in-process object.

export type Snapshot = {
  uptimeSeconds: number
  ai: {
    requested: number
    succeeded: number
    failed: number
    avgDurationMs: number
  }
  errors: {
    total: number
    byStatus: Record<number, number>
  }
}

const AI_KEY = 'metrics:ai'
const ERR_KEY = 'metrics:errors'
const STARTED_KEY = 'metrics:startedAt'

const localStartedAt = Date.now()

if (redis) {
  // Best-effort: only sets if absent, so the first instance "wins" and uptime is
  // consistent across the cluster. Fire-and-forget at boot.
  void redis.set(STARTED_KEY, String(localStartedAt), { nx: true }).catch((err) => {
    captureException(err, { kind: 'metrics_redis_error' })
  })
}

// --- In-memory branch ------------------------------------------------------

const memory = {
  aiInsightsRequested: 0,
  aiInsightsSucceeded: 0,
  aiInsightsFailed: 0,
  aiDurationMsTotal: 0,
  apiErrorsByStatus: {} as Record<number, number>,
}

function memorySnapshot(): Snapshot {
  const totalCompleted = memory.aiInsightsSucceeded + memory.aiInsightsFailed
  const avgAiDurationMs = totalCompleted === 0 ? 0 : Math.round(memory.aiDurationMsTotal / totalCompleted)
  const totalErrors = Object.values(memory.apiErrorsByStatus).reduce((s, n) => s + n, 0)
  return {
    uptimeSeconds: Math.round((Date.now() - localStartedAt) / 1000),
    ai: {
      requested: memory.aiInsightsRequested,
      succeeded: memory.aiInsightsSucceeded,
      failed: memory.aiInsightsFailed,
      avgDurationMs: avgAiDurationMs,
    },
    errors: {
      total: totalErrors,
      byStatus: memory.apiErrorsByStatus,
    },
  }
}

// --- Public API ------------------------------------------------------------

export function recordAiInsight(outcome: 'success' | 'failure', durationMs: number) {
  if (redis) {
    void Promise.all([
      redis.hincrby(AI_KEY, 'requested', 1),
      redis.hincrby(AI_KEY, outcome === 'success' ? 'succeeded' : 'failed', 1),
      redis.hincrby(AI_KEY, 'durationMsTotal', Math.round(durationMs)),
    ]).catch((err) => captureException(err, { kind: 'metrics_redis_error' }))
    return
  }
  memory.aiInsightsRequested += 1
  if (outcome === 'success') memory.aiInsightsSucceeded += 1
  else memory.aiInsightsFailed += 1
  memory.aiDurationMsTotal += durationMs
}

export function recordApiError(status: number) {
  if (redis) {
    void redis.hincrby(ERR_KEY, String(status), 1).catch((err) => {
      captureException(err, { kind: 'metrics_redis_error' })
    })
    return
  }
  memory.apiErrorsByStatus[status] = (memory.apiErrorsByStatus[status] ?? 0) + 1
}

export async function snapshot(): Promise<Snapshot> {
  if (!redis) return memorySnapshot()

  try {
    const [aiHash, errHash, startedAtRaw] = await Promise.all([
      redis.hgetall<Record<string, string | number>>(AI_KEY),
      redis.hgetall<Record<string, string | number>>(ERR_KEY),
      redis.get<string>(STARTED_KEY),
    ])

    const ai = aiHash ?? {}
    const requested = num(ai.requested)
    const succeeded = num(ai.succeeded)
    const failed = num(ai.failed)
    const durationMsTotal = num(ai.durationMsTotal)
    const completed = succeeded + failed
    const avgDurationMs = completed === 0 ? 0 : Math.round(durationMsTotal / completed)

    const byStatus: Record<number, number> = {}
    let totalErrors = 0
    for (const [k, v] of Object.entries(errHash ?? {})) {
      const status = Number(k)
      const count = num(v)
      if (!Number.isNaN(status)) {
        byStatus[status] = count
        totalErrors += count
      }
    }

    const startedAt = startedAtRaw ? Number(startedAtRaw) : localStartedAt
    return {
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      ai: { requested, succeeded, failed, avgDurationMs },
      errors: { total: totalErrors, byStatus },
    }
  } catch (err) {
    captureException(err, { kind: 'metrics_redis_error' })
    return memorySnapshot()
  }
}

function num(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}
