import Fastify, { FastifyInstance } from 'fastify'
import mongoose from 'mongoose'

import { applyRoutes } from './router'

const PORT = process.env.PORT ?? '1996'

class Server {
  #app: FastifyInstance
  #connection: mongoose.Connection | undefined

  constructor() {
    this.#app = Fastify({ logger: true })
    this.#config()
  }

  #config() {
    this.#app.addHook('preHandler', (req, reply, done) => {
      reply.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
      reply.header('Access-Control-Allow-Origin', '*')
      reply.header(
        'Access-Control-Allow-Headers',
        'Authorization, Content-Type'
      )
      done()
    })
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
      this.#app.log.info('Mongo connection disconnected')
      this.#app.log.info('Trying to reconnected to Mongo...')
      setTimeout(() => {
        mongoose.connect(process.env.MONGO_URI as string, {
          ...connection,
          connectTimeoutMS: 3000,
          socketTimeoutMS: 3000
        })
      }, 3000)
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
      await this.#app.listen(PORT)
      this.#mongo()
    } catch (e) {
      console.error(e)
    }
  }
}

const server = new Server()

export { server as Server }
