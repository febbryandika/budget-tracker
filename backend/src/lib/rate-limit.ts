import { rateLimiter } from 'hono-rate-limiter'
import type { Context } from 'hono'
import type { AppEnv } from './middleware'

// In-memory store is fine for single-instance dev. For multi-instance / Workers
// deployment, swap in a KV-backed store (Cloudflare KV, Upstash, etc.).

function tooMany(message: string) {
  return (c: Context) =>
    c.json({ error: { code: 'RATE_LIMITED', message } }, 429)
}

function ipKey(c: Context): string {
  const xff = c.req.header('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  return c.req.header('cf-connecting-ip') ?? c.req.header('x-real-ip') ?? 'unknown'
}

export const aiMinuteLimit = rateLimiter<AppEnv>({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: 'draft-7',
  keyGenerator: (c) => `ai:min:${c.get('user').id}`,
  handler: tooMany('Too many insight requests. Try again in a minute.'),
})

export const aiDayLimit = rateLimiter<AppEnv>({
  windowMs: 24 * 60 * 60_000,
  limit: 50,
  standardHeaders: 'draft-7',
  keyGenerator: (c) => `ai:day:${c.get('user').id}`,
  handler: tooMany('Daily insight limit reached. Try again tomorrow.'),
})

export const authLimit = rateLimiter({
  windowMs: 15 * 60_000,
  limit: process.env.E2E === '1' ? 10_000 : 10,
  standardHeaders: 'draft-7',
  keyGenerator: ipKey,
  handler: tooMany('Too many auth attempts. Try again in 15 minutes.'),
})
