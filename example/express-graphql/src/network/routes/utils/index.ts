import { type NextFunction, type Request, type Response } from 'express'
import httpErrors from 'http-errors'
import { ZodType } from 'zod'

type Middleware = (req: Request, res: Response, next: NextFunction) => void

const validatorCompiler = (
  schema: ZodType,
  value: 'body' | 'params'
): Middleware => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[value])

    if (result.success) return next()

    return next(
      new httpErrors.UnprocessableEntity(JSON.stringify(result.error))
    )
  }
}

export { validatorCompiler }
