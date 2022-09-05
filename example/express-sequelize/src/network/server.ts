import { Server as HttpServer } from 'http'
import express from 'express'
import cors from 'cors'
import pino, { HttpLogger } from 'express-pino-logger'

import { dbConnection } from 'database'
import { applyRoutes } from './router'

const PORT = (process.env.PORT as string) || 1996
const ENVIRONMENTS_WITHOUT_PRETTY_PRINT = ['production', 'ci']

class Server {
  #app: express.Application
  #log: HttpLogger
  #server: HttpServer | undefined
  #connection: Awaited<ReturnType<typeof dbConnection>> | undefined

  constructor() {
    this.#app = express()
    this.#log = pino({
      transport: !ENVIRONMENTS_WITHOUT_PRETTY_PRINT.includes(
        process.env.NODE_ENV as string
      )
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

  async #dbConnection() {
    this.#connection = await dbConnection(this.#log.logger)
  }

  public async start(): Promise<void> {
    try {
      await this.#dbConnection()
      await this.#connection?.connect()
      this.#server = this.#app.listen(PORT, () => {
        this.#log.logger.info(`Server running at port ${PORT}`)
      })
    } catch (e) {
      this.#log.logger.error(e)
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.#connection?.disconnect()
      this.#server?.close()
    } catch (e) {
      this.#log.logger.error(e)
    }
  }
}

const server = new Server()

export { server as Server }
