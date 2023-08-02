import fastify, { FastifyInstance } from 'fastify'
import debug from 'debug'

import { dbConnection } from 'database'
import { Log } from 'utils'
import { applyRoutes } from './router'
import { validatorCompiler } from './utils'

const d = debug('App:Network:Server')
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 1996

class Server implements Log {
  #app: FastifyInstance
  #connection: Awaited<ReturnType<typeof dbConnection>>

  constructor() {
    this.#app = fastify()
    this.#connection = dbConnection(d)
  }

  async #config() {
    this.#app.register(require('@fastify/cors'), {})
    this.#app.addHook('preHandler', (req, reply, done) => {
      reply.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
      reply.header('Access-Control-Allow-Origin', '*')
      reply.header(
        'Access-Control-Allow-Headers',
        'Authorization, Content-Type'
      )
      reply.header('x-powered-by', 'Simba.js')
      done()
    })
    this.#app.setValidatorCompiler(validatorCompiler)
    await applyRoutes(this.#app)
  }

  async start(): Promise<void> {
    try {
      await this.#config()
      await this.#connection.connect()
      await this.#app.listen({
        port: PORT,
        host: '0.0.0.0'
      })
      d(`HTTP server listening on port ${PORT}.`)
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
      await this.#app.close()
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
      `Server invoked -> ${
        this.constructor.name
      } ~ ${method} ~ value: ${value} ~ content: ${JSON.stringify(content)}`
    )
  }
}

const server = new Server()

export { server as Server }
