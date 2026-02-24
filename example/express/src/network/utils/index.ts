import type { NextFunction, Request, Response } from 'express'
import httpErrors from 'http-errors'
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { type ZodType, z } from 'zod'

type Middleware = (req: Request, res: Response, next: NextFunction) => void

const registry = new OpenAPIRegistry()

const validatorCompiler = (
  schema: ZodType,
  value: 'body' | 'params'
): Middleware => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[value])

    if (result.success) return next()

    return next(
      new httpErrors.UnprocessableEntity(JSON.stringify(result.error))
    )
  }
}

const jsonResponse = (schema: ZodType, description: string) => ({
  description,
  content: {
    'application/json': {
      schema: z.object({
        error: z.boolean(),
        message: schema
      })
    }
  }
})

const jsonBody = (schema: ZodType) => ({
  content: {
    'application/json': {
      schema
    }
  }
})

export { registry, validatorCompiler, jsonResponse, jsonBody }
