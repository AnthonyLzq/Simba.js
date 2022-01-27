import Fastify, { FastifyInstance } from 'fastify'
import mongoose from 'mongoose'

import { applyRoutes } from './router'

const PORT = process.env.PORT ?? '1996'

class Server {
  private _app: FastifyInstance
  private _connection: mongoose.Connection | undefined

  constructor() {
    this._app = Fastify({ logger: true })
    this._config()
  }

  private _config() {
    this._app.addHook('preHandler', (req, reply, done) => {
      reply.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
      reply.header('Access-Control-Allow-Origin', '*')
      reply.header(
        'Access-Control-Allow-Headers',
        'Authorization, Content-Type'
      )
      done()
    })
    applyRoutes(this._app)
  }

  private async _mongo(): Promise<void> {
    this._connection = mongoose.connection
    const connection = {
      keepAlive: true,
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
    this._connection.on('connected', () => {
      this._app.log.info('Mongo connection established.')
    })
    this._connection.on('reconnected', () => {
      this._app.log.info('Mongo connection reestablished')
    })
    this._connection.on('disconnected', () => {
      this._app.log.info('Mongo connection disconnected')
      this._app.log.info('Trying to reconnected to Mongo...')
      setTimeout(() => {
        mongoose.connect(process.env.MONGO_URI as string, {
          ...connection,
          connectTimeoutMS: 3000,
          socketTimeoutMS: 3000
        })
      }, 3000)
    })
    this._connection.on('close', () => {
      this._app.log.info('Mongo connection closed')
    })
    this._connection.on('error', (e: Error) => {
      this._app.log.info('Mongo connection error:')
      this._app.log.error(e)
    })
    await mongoose.connect(process.env.MONGO_URI as string, connection)
  }

  public async start(): Promise<void> {
    try {
      await this._app.listen(PORT)
      this._mongo()
    } catch (e) {
      console.error(e)
    }
  }
}

const server = new Server()

export { server as Server }
