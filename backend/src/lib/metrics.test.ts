import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.doUnmock('./redis')
})

describe('metrics — in-memory branch', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('./redis', () => ({ redis: null }))
  })

  it('counts AI insight outcomes and averages duration', async () => {
    const m = await import('./metrics')
    m.recordAiInsight('success', 100)
    m.recordAiInsight('success', 200)
    m.recordAiInsight('failure', 600)

    const snap = await m.snapshot()
    expect(snap.ai.requested).toBe(3)
    expect(snap.ai.succeeded).toBe(2)
    expect(snap.ai.failed).toBe(1)
    expect(snap.ai.avgDurationMs).toBe(300)
  })

  it('tallies API errors by status', async () => {
    const m = await import('./metrics')
    m.recordApiError(400)
    m.recordApiError(400)
    m.recordApiError(503)

    const snap = await m.snapshot()
    expect(snap.errors.total).toBe(3)
    expect(snap.errors.byStatus[400]).toBe(2)
    expect(snap.errors.byStatus[503]).toBe(1)
  })
})

describe('metrics — Upstash branch', () => {
  let store: Record<string, Record<string, number>>
  let setNxCall: { key: string; value: string } | undefined
  const hincrby = vi.fn(async (key: string, field: string, by: number) => {
    store[key] ??= {}
    store[key][field] = (store[key][field] ?? 0) + by
    return store[key][field]
  })
  const hgetall = vi.fn(async (key: string) => (store[key] ? { ...store[key] } : null))
  const get = vi.fn(async (_key: string) => '1700000000000')
  const set = vi.fn(async (key: string, value: string, _opts: { nx: true }) => {
    setNxCall = { key, value }
    return 'OK'
  })

  beforeEach(() => {
    vi.resetModules()
    store = {}
    setNxCall = undefined
    hincrby.mockClear()
    hgetall.mockClear()
    get.mockClear()
    set.mockClear()
    vi.doMock('./redis', () => ({ redis: { hincrby, hgetall, get, set } }))
  })

  it('mirrors AI insight writes to Redis hash fields', async () => {
    const m = await import('./metrics')
    m.recordAiInsight('success', 250)
    m.recordAiInsight('failure', 750)

    // Fire-and-forget — drain pending microtasks before asserting.
    await new Promise((r) => setImmediate(r))

    expect(hincrby).toHaveBeenCalledWith('metrics:ai', 'requested', 1)
    expect(hincrby).toHaveBeenCalledWith('metrics:ai', 'succeeded', 1)
    expect(hincrby).toHaveBeenCalledWith('metrics:ai', 'failed', 1)
    expect(hincrby).toHaveBeenCalledWith('metrics:ai', 'durationMsTotal', 250)
    expect(hincrby).toHaveBeenCalledWith('metrics:ai', 'durationMsTotal', 750)
  })

  it('mirrors API errors to Redis hash by status code', async () => {
    const m = await import('./metrics')
    m.recordApiError(429)
    m.recordApiError(429)
    m.recordApiError(500)

    await new Promise((r) => setImmediate(r))

    expect(hincrby).toHaveBeenCalledWith('metrics:errors', '429', 1)
    expect(hincrby).toHaveBeenCalledWith('metrics:errors', '500', 1)
  })

  it('snapshot reads from Redis and produces the unified shape', async () => {
    store['metrics:ai'] = { requested: 4, succeeded: 3, failed: 1, durationMsTotal: 1200 }
    store['metrics:errors'] = { '400': 2, '503': 1 }

    const m = await import('./metrics')
    const snap = await m.snapshot()

    expect(snap.ai.requested).toBe(4)
    expect(snap.ai.succeeded).toBe(3)
    expect(snap.ai.failed).toBe(1)
    expect(snap.ai.avgDurationMs).toBe(300)
    expect(snap.errors.total).toBe(3)
    expect(snap.errors.byStatus[400]).toBe(2)
    expect(snap.errors.byStatus[503]).toBe(1)
  })

  it('initializes the cluster-wide startedAt with SET NX at boot', async () => {
    await import('./metrics')
    await new Promise((r) => setImmediate(r))

    expect(setNxCall?.key).toBe('metrics:startedAt')
    expect(Number(setNxCall?.value)).toBeGreaterThan(0)
  })

  it('falls back to memory snapshot when Redis read throws', async () => {
    hgetall.mockRejectedValueOnce(new Error('redis down'))
    const m = await import('./metrics')
    const snap = await m.snapshot()

    expect(snap.ai.requested).toBe(0)
    expect(snap.errors.total).toBe(0)
  })
})
