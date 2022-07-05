import fastify, { FastifyInstance } from 'fastify'
import mongoose from 'mongoose'

import { applyRoutes } from './router'
import { validatorCompiler } from './utils'

const PORT = process.env.PORT ?? 1996

class Server {
  #app: FastifyInstance
  #connection: mongoose.Connection | undefined

  constructor() {
    this.#app = fastify({
      logger: {
        prettyPrint: !['production', 'ci'].includes(
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

  async #mongo(): Promise<void> {
    this.#connection = mongoose.connection
    const connection = {
      keepAlive: true,
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
    this.#connection.on('connected', () => {
      this.#app.log.info('Mongo connection established.')
    })
    this.#connection.on('reconnected', () => {
      this.#app.log.info('Mongo connection reestablished')
    })
    this.#connection.on('disconnected', () => {
      if (!['ci', 'local'].includes(process.env.NODE_ENV as string)) {
        this.#app.log.info(
          'Mongo connection disconnected. Trying to reconnected to Mongo...'
        )
        setTimeout(() => {
          mongoose.connect(process.env.MONGO_URI as string, {
            ...connection,
            connectTimeoutMS: 3000,
            socketTimeoutMS: 3000
          })
        }, 3000)
      }
    })
    this.#connection.on('close', () => {
      this.#app.log.info('Mongo connection closed')
    })
    this.#connection.on('error', (e: Error) => {
      this.#app.log.info('Mongo connection error:')
      this.#app.log.error(e)
    })
    await mongoose.connect(process.env.MONGO_URI as string, connection)
  }

  public async start(): Promise<void> {
    try {
      await this.#mongo()
      await this.#app.listen(PORT)
    } catch (e) {
      console.error(e)
    }
  }

  public async stop(): Promise<void> {
    try {
      if (this.#connection) await this.#connection.close()

      await this.#app.close()
    } catch (e) {
      console.error(e)
    }
  }
}

const server = new Server()

export { server as Server }
