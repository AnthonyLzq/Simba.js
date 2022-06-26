import { createServer, Server as HttpServer } from 'http'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import pino, { HttpLogger } from 'express-pino-logger'
import { ApolloServer } from 'apollo-server-express'
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginLandingPageGraphQLPlayground
} from 'apollo-server-core'

import { mergedSchema as schema } from 'graphQL'
import { applyRoutes } from './router'

const PORT = (process.env.PORT as string) || 1996

class Server {
  #app: express.Application
  #connection: mongoose.Connection | undefined
  #server: HttpServer
  #log: HttpLogger

  constructor() {
    this.#app = express()
    this.#server = createServer(this.#app)
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

  public async start(): Promise<void> {
    const server = new ApolloServer({
      schema,
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer: this.#server }),
        process.env.NODE_ENV === 'production'
          ? ApolloServerPluginLandingPageDisabled()
          : ApolloServerPluginLandingPageGraphQLPlayground()
      ],
      context: (): Context => ({
        log: this.#log.logger
      })
    })

    try {
      await server.start()
      server.applyMiddleware({
        app: this.#app,
        path: '/api'
      })
      applyRoutes(this.#app)
      await this.#mongo()
      this.server.listen(PORT, () => {
        this.#log.logger.info(`Server listening at port: ${PORT}`)
        this.#log.logger.info(
          `GraphQL server listening at: http://localhost:${PORT}${server.graphqlPath}`
        )
      })
    } catch (e) {
      console.error(e)
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
