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

const openai = new OpenAI()

const insightsSchema = z.object({
  insights: z
    .array(z.object({ title: z.string(), body: z.string() }))
    .length(3),
})

const AI_TIMEOUT_MS = 10_000

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

    const started = performance.now()
    try {
      const completion = await openai.chat.completions.parse(
        {
          model: 'gpt-4.1-nano',
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

      const parsed = completion.choices[0].message.parsed
      recordAiInsight('success', performance.now() - started)
      return c.json({ insights: parsed?.insights ?? [], month })
    } catch (err) {
      recordAiInsight('failure', performance.now() - started)
      const requestId = c.get('requestId')
      const message = err instanceof Error ? err.message : String(err)
      console.error(JSON.stringify({ requestId, level: 'error', kind: 'ai_provider', message }))
      captureException(err, { kind: 'ai_provider', requestId, userId: user.id })
      return errorResponse(c, 502, 'AI_PROVIDER_ERROR', 'Unable to generate insights')
    }
  })

export default app
