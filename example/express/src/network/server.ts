import express from 'express'
import mongoose from 'mongoose'
import morgan from 'morgan'
import cors from 'cors'

import { applyRoutes } from './router'

const PORT = (process.env.PORT as string) || '1996'

class Server {
  #app: express.Application
  #connection: mongoose.Connection | undefined

  constructor() {
    this.#app = express()
    this.#config()
  }

  #config() {
    this.#app.use(cors())
    this.#app.use(morgan('dev'))
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
      console.log('Mongo connection established.')
    })
    this.#connection.on('reconnected', () => {
      console.log('Mongo connection reestablished')
    })
    this.#connection.on('disconnected', () => {
      console.log('Mongo connection disconnected')
      console.log('Trying to reconnected to Mongo...')
      setTimeout(() => {
        mongoose.connect(process.env.MONGO_URI as string, {
          ...connection,
          connectTimeoutMS: 3000,
          socketTimeoutMS: 3000
        })
      }, 3000)
    })
    this.#connection.on('close', () => {
      console.log('Mongo connection closed')
    })
    this.#connection.on('error', (e: Error) => {
      console.log('Mongo connection error:')
      console.error(e)
    })
    await mongoose.connect(process.env.MONGO_URI as string, connection)
  }

  public start(): void {
    this.#app.listen(PORT, () => {
      console.log(`Server running at port ${PORT}`)
    })

    try {
      this.#mongo()
    } catch (e) {
      console.error(e)
    }
  }
}

const server = new Server()

export { server as Server }
