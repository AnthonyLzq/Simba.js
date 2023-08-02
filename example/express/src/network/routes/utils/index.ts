import { type NextFunction, type Request, type Response } from 'express'
import httpErrors from 'http-errors'
import { TObject, TProperties } from '@sinclair/typebox'
import Ajv from 'ajv'

const ajv = new Ajv({
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true,
  nullable: true
})

type Middleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void

const validatorCompiler = <T extends TProperties>(
  schema: TObject<T>,
  value: 'body' | 'params'
): Middleware => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validate = ajv.compile(schema)
    const ok = validate(req[value])

    if (!ok && validate.errors) {
      const [error] = validate.errors
      const errorMessage = `${error.dataPath.replace('.', '')} ${error.message}`

      return next(new httpErrors.UnprocessableEntity(errorMessage))
    }

    next()
  }
}

export { validatorCompiler }
