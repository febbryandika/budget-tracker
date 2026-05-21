import { Ratelimit } from '@upstash/ratelimit'
import { rateLimiter } from 'hono-rate-limiter'
import type { Context, MiddlewareHandler } from 'hono'
import { redis } from './redis'
import { captureException } from './sentry'
import type { AppEnv } from './middleware'

// When UPSTASH_REDIS_REST_URL + TOKEN are set, counters live in Redis and are
// consistent across instances/restarts. Otherwise, fall back to a per-process
// in-memory store (fine for solo local dev and tests).

function tooMany(c: Context, message: string) {
  return c.json({ error: { code: 'RATE_LIMITED', message } }, 429)
}

function ipKey(c: Context): string {
  const xff = c.req.header('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  return c.req.header('cf-connecting-ip') ?? c.req.header('x-real-ip') ?? 'unknown'
}

function userKey(c: Context<AppEnv>): string {
  return c.get('user').id
}

function upstashMiddleware<E extends AppEnv | {}>(
  limiter: Ratelimit,
  key: (c: Context<E>) => string,
  message: string,
): MiddlewareHandler<E> {
  return async (c, next) => {
    try {
      const result = await limiter.limit(key(c))
      c.header('X-RateLimit-Limit', String(result.limit))
      c.header('X-RateLimit-Remaining', String(Math.max(0, result.remaining)))
      c.header('X-RateLimit-Reset', String(Math.floor(result.reset / 1000)))
      if (!result.success) return tooMany(c, message)
    } catch (err) {
      // Fail open — availability over strict enforcement on transient Redis issues.
      captureException(err, { kind: 'rate_limit_redis_error' })
    }
    await next()
  }
}

function buildAiMinute(): MiddlewareHandler<AppEnv> {
  if (redis) {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      prefix: 'rl:ai:min',
      analytics: false,
    })
    return upstashMiddleware<AppEnv>(limiter, userKey, 'Too many insight requests. Try again in a minute.')
  }
  return rateLimiter<AppEnv>({
    windowMs: 60_000,
    limit: 5,
    standardHeaders: 'draft-7',
    keyGenerator: (c) => `ai:min:${c.get('user').id}`,
    handler: (c) => tooMany(c, 'Too many insight requests. Try again in a minute.'),
  })
}

function buildAiDay(): MiddlewareHandler<AppEnv> {
  if (redis) {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(50, '1 d'),
      prefix: 'rl:ai:day',
      analytics: false,
    })
    return upstashMiddleware<AppEnv>(limiter, userKey, 'Daily insight limit reached. Try again tomorrow.')
  }
  return rateLimiter<AppEnv>({
    windowMs: 24 * 60 * 60_000,
    limit: 50,
    standardHeaders: 'draft-7',
    keyGenerator: (c) => `ai:day:${c.get('user').id}`,
    handler: (c) => tooMany(c, 'Daily insight limit reached. Try again tomorrow.'),
  })
}

function buildAuth(): MiddlewareHandler {
  const limit = process.env.E2E === '1' ? 10_000 : 10
  if (redis) {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, '15 m'),
      prefix: 'rl:auth',
      analytics: false,
    })
    return upstashMiddleware(limiter, ipKey, 'Too many auth attempts. Try again in 15 minutes.')
  }
  return rateLimiter({
    windowMs: 15 * 60_000,
    limit,
    standardHeaders: 'draft-7',
    keyGenerator: ipKey,
    handler: (c) => tooMany(c, 'Too many auth attempts. Try again in 15 minutes.'),
  })
}

export const aiMinuteLimit = buildAiMinute()
export const aiDayLimit = buildAiDay()
export const authLimit = buildAuth()
