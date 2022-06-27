import { Server as HttpServer } from 'http'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import pino, { HttpLogger } from 'express-pino-logger'

import { applyRoutes } from './router'

const PORT = (process.env.PORT as string) || 1996

class Server {
  #app: express.Application
  #connection: mongoose.Connection | undefined
  #log: HttpLogger
  #server: HttpServer | undefined

  constructor() {
    this.#app = express()
    this.#log = pino({
      transport:
        process.env.ENVIRONMENT !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname'
              }
            }
          : undefined
    })
    this.#config()
  }

  #config() {
    this.#app.use(cors())
    this.#app.use(express.json())
    this.#app.use(express.urlencoded({ extended: false }))
    this.#app.use(this.#log)
    this.#app.use(
      (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
        res.header('Access-Control-Allow-Origin', '*')
        res.header(
          'Access-Control-Allow-Headers',
          'Authorization, Content-Type'
        )
        res.header('x-powered-by', 'Simba.js')
        next()
      }
    )
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
      this.#log.logger.info('Mongo connection established.')
    })
    this.#connection.on('reconnected', () => {
      this.#log.logger.info('Mongo connection reestablished')
    })
    this.#connection.on('disconnected', () => {
      this.#log.logger.info('Mongo connection disconnected')
      this.#log.logger.info('Trying to reconnected to Mongo...')
      setTimeout(() => {
        mongoose.connect(process.env.MONGO_URI as string, {
          ...connection,
          connectTimeoutMS: 3000,
          socketTimeoutMS: 3000
        })
      }, 3000)
    })
    this.#connection.on('close', () => {
      this.#log.logger.info('Mongo connection closed')
    })
    this.#connection.on('error', (e: Error) => {
      this.#log.logger.info('Mongo connection error:')
      this.#log.logger.error(e)
    })
    await mongoose.connect(process.env.MONGO_URI as string, connection)
  }

  public start(): void {
    this.#server = this.#app.listen(PORT, () => {
      this.#log.logger.info(`Server running at port ${PORT}`)
    })

    try {
      this.#mongo()
    } catch (e) {
      this.#log.logger.error(e)
    }
  }

  public stop(): void {
    try {
      if (this.#server) this.#server.close()

      process.exit(0)
    } catch (e) {
      this.#log.logger.error(e)
    }
  }
}

const server = new Server()

export { server as Server }
