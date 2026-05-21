import { zValidator } from '@hono/zod-validator'
import type { ZodType } from 'zod'
import { errorResponse } from './errors'

export function zJson<T extends ZodType>(schema: T) {
  return zValidator('json', schema, (result, c) => {
    if (!result.success) {
      return errorResponse(c, 400, 'VALIDATION_ERROR', 'Invalid request payload', {
        issues: result.error.issues,
      })
    }
  })
}

export function zQuery<T extends ZodType>(schema: T) {
  return zValidator('query', schema, (result, c) => {
    if (!result.success) {
      return errorResponse(c, 400, 'VALIDATION_ERROR', 'Invalid query parameters', {
        issues: result.error.issues,
      })
    }
  })
}
