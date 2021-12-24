import express from 'express'
import mongoose from 'mongoose'
import morgan from 'morgan'

import { applyRoutes } from './router'

const PORT = (process.env.PORT as string) || '1996'

class Server {
  private _app: express.Application
  private _connection: mongoose.Connection | undefined

  constructor() {
    this._app = express()
    this._config()
  }

  private _config() {
    this._app.set('port', PORT)
    this._app.use(morgan('dev'))
    this._app.use(express.json())
    this._app.use(express.urlencoded({ extended: false }))
    this._app.use(
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
      console.log('Mongo connection established.')
    })
    this._connection.on('reconnected', () => {
      console.log('Mongo connection reestablished')
    })
    this._connection.on('disconnected', () => {
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
    this._connection.on('close', () => {
      console.log('Mongo connection closed')
    })
    this._connection.on('error', (e: Error) => {
      console.log('Mongo connection error:')
      console.error(e)
    })
    await mongoose.connect(process.env.MONGO_URI as string, connection)
  }

  public start(): void {
    this._app.listen(PORT, () => {
      console.log(`Server running at port ${PORT}`)
    })

    try {
      this._mongo()
    } catch (e) {
      console.error(e)
    }
  }
}

const server = new Server()

export { server as Server }
