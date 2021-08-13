import httpErrors from 'http-errors'

import { EFU, MFU, GE } from './messages'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
const errorHandling = (e: any, message?: string): never => {
  console.error(e)

  if (e instanceof httpErrors.HttpError)
    throw e

  throw new httpErrors.InternalServerError(message ?? e.message)
}

export { EFU, MFU, GE, errorHandling }
