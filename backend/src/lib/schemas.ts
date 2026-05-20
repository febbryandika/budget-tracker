import { z } from 'zod'

export const entryCreateSchema = z.object({
  amount:     z.number().positive(),
  type:       z.enum(['income', 'expense']),
  categoryId: z.string().optional(),
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note:       z.string().optional(),
})

export const entryUpdateSchema = entryCreateSchema.partial()

export const entryListSchema = z.object({
  month:      z.string().regex(/^\d{4}-\d{2}$/).optional(),
  categoryId: z.string().optional(),
})

export const categoryCreateSchema = z.object({
  name:  z.string().trim().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

export const categoryUpdateSchema = categoryCreateSchema.partial()

export const monthQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
})
