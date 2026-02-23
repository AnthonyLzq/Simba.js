import { type Debugger } from 'debug'

export interface Log {
  log({
    method,
    value,
    content
  }: {
    method: string
    value: string
    content: unknown
  }): void
}

class Logger implements Log {
  #debug: Debugger
  #origin: string

  constructor(debug: Debugger, origin: string) {
    this.#debug = debug
    this.#origin = origin
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
      `${this.#origin} -> ${method} ~ value: ${value} ~ content: ${JSON.stringify(
        content
      )}`
    )
  }
}

export { Logger }
