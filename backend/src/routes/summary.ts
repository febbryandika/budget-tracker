import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { and, eq, gte } from 'drizzle-orm'
import { db } from '../db'
import { entries } from '../db/schema'
import type { AppEnv } from '../lib/middleware'
import { monthQuerySchema } from '../lib/schemas'
import { aggregate, formatMonth, shiftMonth, trendFor } from '../lib/summary-math'

const app = new Hono<AppEnv>()
  .get('/', zValidator('query', monthQuerySchema), async (c) => {
    const user = c.get('user')
    const month = c.req.valid('query').month ?? formatMonth(new Date())

    const oldestMonth = shiftMonth(month, -5)
    const oldestDate = `${oldestMonth}-01`

    const rows = await db
      .select({ type: entries.type, amount: entries.amount, date: entries.date })
      .from(entries)
      .where(and(eq(entries.userId, user.id), gte(entries.date, oldestDate)))

    const current = aggregate(rows, month)

    return c.json({
      month,
      totalIncome:  current.income,
      totalExpense: current.expense,
      net:          current.net,
      trend: trendFor(rows, month),
    })
  })

export default app
