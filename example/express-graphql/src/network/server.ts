import { Server as HttpServer } from 'http'
import express from 'express'
import cors from 'cors'
import debug from 'debug'
import { ApolloServer } from '@apollo/server'
// eslint-disable-next-line import/extensions
import { expressMiddleware } from '@apollo/server/express4'

import { dbConnection } from 'database'
import { applyRoutes } from './router'
import { buildSchemas } from './resolvers'
import { Log } from 'utils'

const d = debug('App:Network:Server')
const PORT = (process.env.PORT as string) || 1996

class Server implements Log {
  #app: express.Application
  #server: HttpServer | undefined
  #connection: Awaited<ReturnType<typeof dbConnection>>
  #apolloServer: ApolloServer | undefined

  constructor() {
    this.#app = express()
    this.#connection = dbConnection(d)
  }

  async #config() {
    await this.#apolloConfig()
    this.#app.use(cors())
    this.#app.use(express.json())
    this.#app.use(express.urlencoded({ extended: false }))
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

  async #apolloConfig() {
    this.#apolloServer = new ApolloServer({
      schema: await buildSchemas()
    })
    await this.#apolloServer.start()
    this.#app.use(
      '/graphql',
      cors(),
      express.json(),
      expressMiddleware(this.#apolloServer)
    )
  }

  async start() {
    try {
      await this.#config()
      await this.#connection?.connect()
      this.#server = this.#app.listen(PORT, () => {
        d(`HTTP server listening on port ${PORT}.`)
      })
    } catch (e) {
      this.log({
        method: this.start.name,
        value: 'error',
        content: e
      })
    }
  }

  async stop() {
    try {
      await this.#connection?.disconnect()
      this.#server?.close()
      await this.#apolloServer?.stop()
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
      } ~ ${method} ~ value: ${value} ~ content: ${content}`
    )
  }
}

const server = new Server()

export { server as Server }
