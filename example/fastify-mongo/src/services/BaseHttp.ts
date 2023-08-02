import { Debugger } from 'debug'
import httpErrors, {
  HttpErrorConstructor,
  NamedConstructors
} from 'http-errors'

import { Log } from 'utils'
import { GE } from './utils'

type FilterNumberKeys<T> = {
  [K in keyof T]: T[K] extends HttpErrorConstructor<infer N>
    ? N extends number
      ? K
      : never
    : never
}[keyof T]

type ErrorCodes = FilterNumberKeys<NamedConstructors>

class BaseHttpService implements Log {
  #debug: Debugger

  constructor(debug: Debugger) {
    this.#debug = debug
  }

  log({
    method,
    value,
    content
  }: {
    method: string
    value: string
    content: unknown
  }) {
    this.#debug(
      `Service invoked -> ${
        this.constructor.name
      } ~ ${method} ~ value: ${value} ~ content: ${JSON.stringify(content)}`
    )
  }

  errorHandling(
    error: unknown,
    {
      message,
      code
    }:
      | {
          message?: string
          code?: never
        }
      | {
          message?: never
          code: ErrorCodes
        } = {
      message: GE.INTERNAL_SERVER_ERROR
    }
  ): never {
    this.log({
      method: this.errorHandling.name,
      value: 'error',
      content: error
    })

    if (code)
      throw new httpErrors[code](
        message ?? (error as { message: string }).message
      )

    throw new httpErrors.InternalServerError(
      message ?? (error as { message: string }).message
    )
  }
}

export { BaseHttpService }
