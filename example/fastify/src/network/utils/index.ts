/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  FastifyRouteSchemaDef,
  FastifyValidationResult
} from 'fastify/types/schema'
import httpErrors from 'http-errors'
import Ajv from 'ajv'

const ajv = new Ajv({
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true
})

const validatorCompiler = ({
  schema
}: FastifyRouteSchemaDef<any>): FastifyValidationResult => {
  const validate = ajv.compile(schema)

  return (data: unknown): boolean => {
    const ok = validate(data)

    if (!ok && validate.errors) {
      const [error] = validate.errors
      const errorMessage = `${error.instancePath.replace('/', '')} ${
        error.message
      }`

      throw new httpErrors.UnprocessableEntity(errorMessage)
    }

    return true
  }
}

export { validatorCompiler }
