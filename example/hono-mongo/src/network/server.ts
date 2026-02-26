import { serve, type ServerType } from '@hono/node-server'
import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import debug from 'debug'

import { dbConnection } from 'database'
import type { Log } from 'utils'
import { applyRoutes } from './router'

const d = debug('App:Network:Server')
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 1996

class Server implements Log {
  #app: OpenAPIHono
  #server: ServerType | undefined
  #connection: Awaited<ReturnType<typeof dbConnection>>

  constructor() {
    this.#app = new OpenAPIHono()
    this.#connection = dbConnection(d)
  }

  #config() {
    this.#app.use('*', cors())
    this.#app.use('*', async (c, next) => {
      c.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
      c.header('Access-Control-Allow-Origin', '*')
      c.header('Access-Control-Allow-Headers', 'Authorization, Content-Type')
      c.header('x-powered-by', 'Simba.js')
      await next()
    })
    applyRoutes(this.#app)
  }

  async start(): Promise<void> {
    try {
      this.#config()
      await this.#connection?.connect()
      this.#server = serve(
        {
          fetch: this.#app.fetch,
          port: PORT
        },
        () => {
          d(`HTTP server listening on port ${PORT}.`)
        }
      )
    } catch (e) {
      this.log({
        method: this.start.name,
        value: 'error',
        content: e
      })
    }
  }

  async stop(): Promise<void> {
    try {
      await this.#connection?.disconnect()
      this.#server?.close()
      d('HTTP server stopped.')
    } catch (e) {
      this.log({
        method: this.stop.name,
        value: 'error',
        content: e
      })
    }
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
    d(
      `Server invoked -> ${this.constructor.name} ~ ${method} ~ value: ${value} ~ content: ${JSON.stringify(content)}`
    )
  }
}

const server = new Server()

export { server as Server }
