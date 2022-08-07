import fastify, { FastifyInstance } from 'fastify'

import { dbConnection } from 'database'
import { applyRoutes } from './router'
import { validatorCompiler } from './utils'

const PORT = process.env.PORT ?? 1996
const ENVIRONMENTS_WITHOUT_PRETTY_PRINT = ['production', 'ci']

class Server {
  #app: FastifyInstance
  #connection: Awaited<ReturnType<typeof dbConnection>> | undefined

  constructor() {
    this.#app = fastify({
      logger: {
        prettyPrint: !ENVIRONMENTS_WITHOUT_PRETTY_PRINT.includes(
          process.env.NODE_ENV as string
        )
      }
    })
    this.#config()
  }

  #config() {
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
    applyRoutes(this.#app)
  }

  async #dbConnection() {
    this.#connection = await dbConnection(this.#app.log)
  }

  public async start(): Promise<void> {
    try {
      await this.#dbConnection()
      await this.#connection?.connect()
      await this.#app.listen(PORT)
    } catch (e) {
      console.error(e)
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.#connection?.disconnect()
      await this.#app.close()
    } catch (e) {
      console.error(e)
    }
  }
}

const server = new Server()

export { server as Server }
