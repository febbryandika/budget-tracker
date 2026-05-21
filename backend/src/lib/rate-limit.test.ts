import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Hono } from 'hono'

const limitMock = vi.fn()

beforeEach(() => {
  vi.resetModules()
  limitMock.mockReset()
  vi.doMock('./redis', () => ({ redis: { __mocked: true } }))
  vi.doMock('@upstash/ratelimit', () => ({
    Ratelimit: class FakeRatelimit {
      limit = limitMock
      static slidingWindow = () => ({})
    },
  }))
})

afterEach(() => {
  vi.doUnmock('./redis')
  vi.doUnmock('@upstash/ratelimit')
})

async function loadAiMinute() {
  const mod = await import('./rate-limit')
  const app = new Hono()
  app.use('*', async (c, next) => {
    c.set('user', { id: 'u1' })
    await next()
  })
  app.get('/x', mod.aiMinuteLimit, (c) => c.json({ ok: true }))
  return app
}

describe('aiMinuteLimit — Upstash branch', () => {
  it('passes through when under the limit and sets rate-limit headers', async () => {
    limitMock.mockResolvedValueOnce({ success: true, limit: 5, remaining: 4, reset: 1_700_000_000_000 })
    const app = await loadAiMinute()
    const res = await app.request('/x')

    expect(res.status).toBe(200)
    expect(res.headers.get('X-RateLimit-Limit')).toBe('5')
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('4')
    expect(res.headers.get('X-RateLimit-Reset')).toBe('1700000000')
  })

  it('returns 429 with structured envelope when limit is exceeded', async () => {
    limitMock.mockResolvedValueOnce({ success: false, limit: 5, remaining: 0, reset: 1_700_000_000_000 })
    const app = await loadAiMinute()
    const res = await app.request('/x')

    expect(res.status).toBe(429)
    const body = (await res.json()) as { error: { code: string; message: string } }
    expect(body.error.code).toBe('RATE_LIMITED')
    expect(body.error.message).toMatch(/insight/i)
  })

  it('fails open when Redis throws', async () => {
    limitMock.mockRejectedValueOnce(new Error('boom'))
    const app = await loadAiMinute()
    const res = await app.request('/x')

    expect(res.status).toBe(200)
  })

  it('keys by user id', async () => {
    limitMock.mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: 0 })
    const app = await loadAiMinute()
    await app.request('/x')
    expect(limitMock).toHaveBeenCalledWith('u1')
  })
})

describe('authLimit — Upstash branch', () => {
  it('keys by x-forwarded-for IP', async () => {
    limitMock.mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: 0 })
    const mod = await import('./rate-limit')
    const app = new Hono().get('/x', mod.authLimit, (c) => c.json({ ok: true }))

    const res = await app.request('/x', {
      headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' },
    })

    expect(res.status).toBe(200)
    expect(limitMock).toHaveBeenCalledWith('203.0.113.7')
  })
})
