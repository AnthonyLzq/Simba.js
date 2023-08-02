import { Debugger } from 'debug'

export interface Log {
  log({
    origin,
    method,
    value,
    content
  }: {
    origin?: string
    method: string
    value: string
    content: unknown
  }): void
}

class Logger implements Log {
  #debug: Debugger

  constructor(debug: Debugger) {
    this.#debug = debug
  }

  log({
    origin,
    method,
    value,
    content
  }: {
    origin: string
    method: string
    value: string
    content: unknown
  }) {
    this.#debug(
      `${origin} -> ${method} ~ value: ${value} ~ content: ${JSON.stringify(
        content
      )}`
    )
  }
}

export { Logger }
