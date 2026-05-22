import { Hono } from 'hono'
import { and, eq, like } from 'drizzle-orm'
import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import { db } from '../db'
import { categories, entries } from '../db/schema'
import { errorResponse } from '../lib/errors'
import type { AppEnv } from '../lib/middleware'
import { recordAiInsight } from '../lib/metrics'
import { aiDayLimit, aiMinuteLimit } from '../lib/rate-limit'
import { monthQuerySchema as querySchema } from '../lib/schemas'
import { captureException } from '../lib/sentry'
import { zQuery } from '../lib/validator'

// Defer construction — OpenAI() throws if OPENAI_API_KEY is missing, and
// Workers deploy validation loads this module without secrets.
let _openai: OpenAI | undefined
function openai(): OpenAI {
  if (!_openai) _openai = new OpenAI()
  return _openai
}

const insightsSchema = z.object({
  insights: z
    .array(z.object({ title: z.string(), body: z.string() }))
    .length(3),
})

const AI_TIMEOUT_MS = 10_000
const PRIMARY_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4.1-nano'
const FALLBACK_MODEL = 'gpt-4.1-mini'

const app = new Hono<AppEnv>()
  .get('/', aiMinuteLimit, aiDayLimit, zQuery(querySchema), async (c) => {
    const user = c.get('user')
    const month = c.req.valid('query').month ?? new Date().toISOString().slice(0, 7)

    const data = await db
      .select({ type: entries.type, amount: entries.amount, category: categories.name })
      .from(entries)
      .leftJoin(categories, eq(entries.categoryId, categories.id))
      .where(and(eq(entries.userId, user.id), like(entries.date, `${month}%`)))

    if (data.length === 0) {
      return c.json({ insights: [], month, message: 'Add entries this month to get insights.' })
    }

    const totalIncome = data
      .filter((e) => e.type === 'income')
      .reduce((s, e) => s + Number(e.amount), 0)
    const totalExpense = data
      .filter((e) => e.type === 'expense')
      .reduce((s, e) => s + Number(e.amount), 0)
    const byCategory = Object.groupBy(
      data.filter((e) => e.type === 'expense'),
      (e) => e.category ?? 'Other',
    )

    const summary = {
      month,
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      byCategory: Object.entries(byCategory).map(([category, es]) => ({
        category,
        total: es?.reduce((s, e) => s + Number(e.amount), 0) ?? 0,
      })),
    }

    const runCompletion = (model: string) =>
      openai().chat.completions.parse(
        {
          model,
          messages: [
            {
              role: 'system',
              content:
                'You are a personal finance assistant. Given a monthly budget summary, return exactly 3 short, specific insights (1–2 sentences each). Be concrete — reference actual numbers and categories.',
            },
            { role: 'user', content: JSON.stringify(summary) },
          ],
          response_format: zodResponseFormat(insightsSchema, 'insights'),
        },
        { timeout: AI_TIMEOUT_MS },
      )

    const started = performance.now()
    let completion: Awaited<ReturnType<typeof runCompletion>> | undefined
    let lastError: unknown
    try {
      completion = await runCompletion(PRIMARY_MODEL)
    } catch (err) {
      lastError = err
      const is404 = err instanceof OpenAI.APIError && err.status === 404
      if (is404 && PRIMARY_MODEL !== FALLBACK_MODEL) {
        try {
          completion = await runCompletion(FALLBACK_MODEL)
          lastError = undefined
        } catch (err2) {
          lastError = err2
        }
      }
    }

    if (completion) {
      const parsed = completion.choices[0].message.parsed
      recordAiInsight('success', performance.now() - started)
      return c.json({ insights: parsed?.insights ?? [], month })
    }

    recordAiInsight('failure', performance.now() - started)
    const requestId = c.get('requestId')
    const message = lastError instanceof Error ? lastError.message : String(lastError)
    console.error(JSON.stringify({ requestId, level: 'error', kind: 'ai_provider', message }))
    captureException(lastError, { kind: 'ai_provider', requestId, userId: user.id })
    return errorResponse(c, 502, 'AI_PROVIDER_ERROR', 'Unable to generate insights')
  })

export default app
