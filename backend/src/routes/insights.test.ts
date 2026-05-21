import { describe, it, expect, vi, beforeEach } from 'vitest'

const { parseMock } = vi.hoisted(() => ({ parseMock: vi.fn() }))

vi.mock('../db', async () => ({ db: (await import('../test/db')).testDb }))
vi.mock('../lib/auth', async () => ({ auth: (await import('../test/auth-mock')).authMock }))
vi.mock('openai', async () => {
  const actual = await vi.importActual<typeof import('openai')>('openai')
  class MockOpenAI {
    chat = { completions: { parse: parseMock } }
  }
  // Preserve OpenAI.APIError so `err instanceof OpenAI.APIError` checks work in the route.
  ;(MockOpenAI as unknown as { APIError: unknown }).APIError = actual.default.APIError
  return { default: MockOpenAI }
})

import OpenAI from 'openai'
import server from '../index'
import { authedHeaders, createEntry, createUser, request } from '../test/helpers'

beforeEach(() => {
  parseMock.mockReset()
})

describe('GET /api/insights', () => {
  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(server, '/api/insights?month=2026-05')
    expect(res.status).toBe(401)
  })

  it('returns empty insights with a helpful message when no entries exist', async () => {
    const u = await createUser()
    const res = await request(server, '/api/insights?month=2026-05', {
      headers: authedHeaders(u.id),
    })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      insights: [],
      month: '2026-05',
      message: 'Add entries this month to get insights.',
    })
    expect(parseMock).not.toHaveBeenCalled()
  })

  it('returns 3 insights when OpenAI succeeds', async () => {
    const u = await createUser()
    await createEntry({ userId: u.id, type: 'expense', amount: 50, date: '2026-05-10' })
    parseMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            parsed: {
              insights: [
                { title: 'Spending focus', body: 'You spent $50 on expenses.' },
                { title: 'Tip 2', body: 'Watch your food category.' },
                { title: 'Tip 3', body: 'Save 10%.' },
              ],
            },
          },
        },
      ],
    })

    const res = await request(server, '/api/insights?month=2026-05', {
      headers: authedHeaders(u.id),
    })
    expect(res.status).toBe(200)
    const body = res.body as { insights: Array<{ title: string }>; month: string }
    expect(body.month).toBe('2026-05')
    expect(body.insights).toHaveLength(3)
    expect(body.insights[0]!.title).toBe('Spending focus')
    expect(parseMock).toHaveBeenCalledTimes(1)
  })

  it('returns 502 AI_PROVIDER_ERROR when OpenAI throws', async () => {
    const u = await createUser()
    await createEntry({ userId: u.id, type: 'expense', amount: 50, date: '2026-05-10' })
    parseMock.mockRejectedValueOnce(new Error('openai down'))

    const res = await request(server, '/api/insights?month=2026-05', {
      headers: authedHeaders(u.id),
    })
    expect(res.status).toBe(502)
    expect(res.body).toEqual({
      error: { code: 'AI_PROVIDER_ERROR', message: 'Unable to generate insights' },
    })
  })

  it('falls back to gpt-4.1-mini when the primary model returns 404', async () => {
    const u = await createUser()
    await createEntry({ userId: u.id, type: 'expense', amount: 50, date: '2026-05-10' })

    const apiError = new OpenAI.APIError(
      404,
      { error: { message: 'model_not_found' } },
      'not found',
      new Headers(),
    )
    parseMock.mockRejectedValueOnce(apiError).mockResolvedValueOnce({
      choices: [
        {
          message: {
            parsed: {
              insights: [
                { title: 'A', body: 'a' },
                { title: 'B', body: 'b' },
                { title: 'C', body: 'c' },
              ],
            },
          },
        },
      ],
    })

    const res = await request(server, '/api/insights?month=2026-05', {
      headers: authedHeaders(u.id),
    })

    expect(res.status).toBe(200)
    expect(parseMock).toHaveBeenCalledTimes(2)
    expect(parseMock.mock.calls[0]![0].model).toBe('gpt-4.1-nano')
    expect(parseMock.mock.calls[1]![0].model).toBe('gpt-4.1-mini')
  })

  it('does not retry on non-404 OpenAI errors', async () => {
    const u = await createUser()
    await createEntry({ userId: u.id, type: 'expense', amount: 50, date: '2026-05-10' })

    const apiError = new OpenAI.APIError(
      500,
      { error: { message: 'server_error' } },
      'server error',
      new Headers(),
    )
    parseMock.mockRejectedValueOnce(apiError)

    const res = await request(server, '/api/insights?month=2026-05', {
      headers: authedHeaders(u.id),
    })

    expect(res.status).toBe(502)
    expect(parseMock).toHaveBeenCalledTimes(1)
  })

  it('isolates insights data per user (does not see other users\' entries)', async () => {
    const a = await createUser()
    const b = await createUser()
    await createEntry({ userId: b.id, type: 'expense', amount: 9999, date: '2026-05-10' })

    const res = await request(server, '/api/insights?month=2026-05', {
      headers: authedHeaders(a.id),
    })
    // A has no entries this month → empty-data short-circuit, no OpenAI call.
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      insights: [],
      month: '2026-05',
      message: 'Add entries this month to get insights.',
    })
    expect(parseMock).not.toHaveBeenCalled()
  })
})
