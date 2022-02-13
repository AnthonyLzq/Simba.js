const os = require('os')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const writeFile = require('../utils/writeFile')

/*
 * Express api:
 * src
 * |- @types:
 * |- |- custom:
 * |- |- |- request: content, file
 * |- |- |- response: content, file
 * |- |- dto:
 * |- |- |- user: content, file
 * |- |- models:
 * |- |- |- user: content, file
 * |  |- index: content, file
 * |- database:
 * |  |- mongo:
 * |  |- |- models:
 * |  |- |- |- index: content, file
 * |  |- |- |- user: content, file
 * |  |- |- queries:
 * |  |- |- |- index: content, file
 * |  |- |- |- user: content, file
 * |  |- |- index: content, file
 * |  |- index: content, file
 * |- network:
 * |  |- routes:
 * |  |  |- schemas:
 * |  |  |  |- user: content, file
 * |  |  |  |- index: content, file
 * |  |  |- home: content, file
 * |  |  |- index: content, file
 * |  |  |- user: content, file
 * |  |- response: content, file
 * |  |- router: content, file
 * |  |- server: content, file
 * |  |- index: content, file
 * |- services:
 * |  |- utils:
 * |  |  |- messages:
 * |  |  |  |- user: content, file
 * |  |  |  |- index: content, file
 * |  |  |- index: content, file
 * |  |- user: content, file
 * |  |- index: content, file
 * |- utils:
 * |  |- docs.json: content, file
 * |  |- index: content, file
 * |- .env: content, file
 * |- index: content, file
 * index.http: content, file
 */

/*
 * Fastify api:
 * src
 * |- @types:
 * |- |- dto:
 * |- |- |- user: content, file
 * |- |- models:
 * |- |- |- user: content, file
 * |  |- index: content, file
 * |- database:
 * |  |- mongo:
 * |  |- |- models:
 * |  |- |- |- index: content, file
 * |  |- |- |- user: content, file
 * |  |- |- queries:
 * |  |- |- |- index: content, file
 * |  |- |- |- user: content, file
 * |  |- |- index: content, file
 * |  |- index: content, file
 * |- network:
 * |  |- routes:
 * |  |  |- schemas:
 * |  |  |  |- user: content, file
 * |  |  |  |- index: content, file
 * |  |  |- home: content, file
 * |  |  |- user: content, file
 * |  |  |- index: content, file
 * |  |- response: content, file
 * |  |- router: content, file
 * |  |- server: content, file
 * |  |- index: content, file
 * |- services:
 * |  |- utils:
 * |  |  |- messages:
 * |  |  |  |- user: content, file
 * |  |  |  |- index: content, file
 * |  |  |- index: content, file
 * |  |- user: content, file
 * |  |- index: content, file
 * |- .env: content, file
 * |- index: content, file
 * index.http: content, file
 */

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {String} args.projectVersion
 * @param {String} args.email
 * @param {Boolean|undefined} args.fastify
 */
module.exports = async ({
  projectName,
  projectVersion,
  email,
  fastify = false
}) => {
  const data = {
    '@types': {
      index: {
        content: `/* eslint-disable no-var */
declare global {}

export {}
`,
        file: `${projectName}/src/@types/index.d.ts`
      }
    },
    '@types/dto': {
      user: {
        content: `interface DtoUser {
  id: string
  lastName: string
  name: string
}
`,
        file: `${projectName}/src/@types/dto/user.d.ts`
      }
    },
    '@types/models': {
      user: {
        content: `interface IUser {
  id: string
  name: string
  lastName: string
  updatedAt: Date
}
`,
        file: `${projectName}/src/@types/models/user.d.ts`
      }
    },
    database: {
      index: {
        content: "export * from './mongo'\n",
        file: `${projectName}/src/database/index.ts`
      }
    },
    'database/mongo': {
      index: {
        content: `export * from './models'
export * from './queries'
`,
        file: `${projectName}/src/database/mongo/index.ts`
      }
    },
    'database/mongo/models': {
      index: {
        content: "export * from './user'\n",
        file: `${projectName}/src/database/mongo/models/index.ts`
      },
      user: {
        content: `import { model, Schema } from 'mongoose'

const User = new Schema<IUser>(
  {
    lastName: {
      required: true,
      type: String
    },
    name: {
      required: true,
      type: String
    }
  },
  {
    timestamps: {
      createdAt: false,
      updatedAt: true
    },
    versionKey: false,
    toJSON: {
      transform(_, ret) {
        ret.id = ret._id.toString()
        ret.updatedAt = ret.updatedAt.toISOString()
        delete ret._id
        delete ret.__v
      },
      virtuals: true
    }
  }
)

const UserModel = model<IUser>('users', User)

export { UserModel }
`,
        file: `${projectName}/src/database/mongo/models/user.ts`
      }
    },
    'database/mongo/queries': {
      index: {
        content: "export * from './user'\n",
        file: `${projectName}/src/database/mongo/queries/index.ts`
      },
      user: {
        content: `import { UserModel } from '..'

const store = async (userData: DtoUser): Promise<IUser> => {
  const user = new UserModel(userData)
  await user.save()

  return user.toJSON()
}

const remove = async (
  id: string | null = null
): Promise<IUser | number | null> => {
  if (id) return await UserModel.findByIdAndRemove(id)

  return (await UserModel.deleteMany({})).deletedCount
}

const get = async (
  id: string | null = null
): Promise<IUser[] | IUser | null> => {
  if (id) {
    const user = await UserModel.findById(id)

    return user ? user.toJSON() : null
  }

  const users = await UserModel.find({})

  return users.map(u => u.toJSON())
}

const update = async (userData: DtoUser): Promise<IUser | null> => {
  const { id, ...rest } = userData
  const user = await UserModel.findByIdAndUpdate(id, rest, { new: true })

  return user ? user.toJSON() : null
}

export { store, remove, get, update }
`,
        file: `${projectName}/src/database/mongo/queries/user.ts`
      }
    },
    network: {
      index: {
        content: `export * from './routes'
export * from './server'
`,
        file: `${projectName}/src/network/index.ts`
      }
    },
    services: {
      index: {
        content: "export * from './user'\n",
        file: `${projectName}/src/services/index.ts`
      },
      user: {
        content: `import httpErrors from 'http-errors'

import { store, remove, get, update } from 'database'
import { EFU, MFU, GE, errorHandling } from './utils'

type Process = {
  type: 'store' | 'getAll' | 'deleteAll' | 'getOne' | 'update' | 'delete'
}

class UserService {
  private _args: Partial<DtoUser> | null

  constructor(args: Partial<DtoUser> | null = null) {
    this._args = args
  }

  public process({ type }: Process): Promise<string | IUser[] | IUser> {
    switch (type) {
      case 'store':
        return this._store()
      case 'getAll':
        return this._getAll()
      case 'deleteAll':
        return this._deleteAll()
      case 'getOne':
        return this._getOne()
      case 'update':
        return this._update()
      case 'delete':
        return this._delete()
      default:
        throw new httpErrors.InternalServerError(GE.INTERNAL_SERVER_ERROR)
    }
  }

  private async _store(): Promise<IUser> {
    try {
      const result = await store(this._args as DtoUser)

      return result
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  private async _getAll(): Promise<IUser[]> {
    try {
      const users = (await get()) as IUser[]

      return users
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  private async _deleteAll(): Promise<string> {
    try {
      const usersDeleted = (await remove()) as number

      if (usersDeleted >= 1) return MFU.ALL_USERS_DELETED

      if (usersDeleted === 0)
        throw new httpErrors.Conflict(EFU.NOTHING_TO_DELETE)

      throw new httpErrors.InternalServerError(GE.INTERNAL_SERVER_ERROR)
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  private async _getOne(): Promise<IUser> {
    const { id } = this._args as DtoUser

    try {
      const user = (await get(id as string)) as IUser | null

      if (!user) throw new httpErrors.NotFound(EFU.NOT_FOUND)

      return user
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  private async _update(): Promise<IUser> {
    try {
      const updatedUser = await update(this._args as DtoUser)

      if (!updatedUser) throw new httpErrors.NotFound(EFU.NOT_FOUND)

      return updatedUser
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  private async _delete(): Promise<string> {
    const { id } = this._args as DtoUser

    try {
      const deletedUser = await remove(id)

      if (!deletedUser) throw new httpErrors.NotFound(EFU.NOT_FOUND)

      return MFU.USER_DELETED
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }
}

export { UserService }
`,
        file: `${projectName}/src/services/user.ts`
      }
    },
    'services/utils': {
      index: {
        content: `import httpErrors from 'http-errors'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errorHandling = (e: any, message?: string): never => {
  console.error(e)

  if (e instanceof httpErrors.HttpError) throw e

  throw new httpErrors.InternalServerError(message ?? e.message)
}

export { errorHandling }
export * from './messages'
`,
        file: `${projectName}/src/services/utils/index.ts`
      }
    },
    'services/utils/messages': {
      index: {
        content: `enum GenericErrors {
  INTERNAL_SERVER_ERROR = 'Something went wrong'
}

export { GenericErrors as GE }
export * from './user'
`,
        file: `${projectName}/src/services/utils/messages/index.ts`
      },
      user: {
        content: `enum ErrorForUser {
  NOT_FOUND = 'The requested user does not exists',
  NOTHING_TO_DELETE = 'There is no user to be deleted'
}

enum MessageForUser {
  ALL_USERS_DELETED = 'All the users were deleted successfully',
  USER_DELETED = 'The requested user was successfully deleted'
}

export { ErrorForUser as EFU, MessageForUser as MFU }
`,
        file: `${projectName}/src/services/utils/messages/user.ts`
      }
    },
    test: {
      index: {
        content: `### Testing store a user
POST http://localhost:1996/api/users
Content-Type: application/json

{
  "args": {
    "lastName": "Lzq",
    "name": "Anthony"
  }
}

### Testing getAll users
GET http://localhost:1996/api/users

### Testing deleteAll users
DELETE http://localhost:1996/api/users

### Testing getOne user
GET http://localhost:1996/api/user/60e7e3b93b01c1a7aa74cd6b

### Testing update user
PATCH http://localhost:1996/api/user/60e7e3b93b01c1a7aa74cd6b
Content-Type: application/json

{
  "args": {
    "name": "Anthony",
    "lastName": "Luzquiños"
  }
}

### Testing delete user
DELETE http://localhost:1996/api/user/60e7e3b93b01c1a7aa74cd6b
`,
        file: `${projectName}/index.http`
      }
    },
    '.env': {
      content: `MONGO_URI = ${
        process.env.LOCAL
          ? process.env.MONGO_URI
          : `mongodb://mongo:mongo@mongo:27017/${projectName}`
      }`,
      file: `${projectName}/.env`
    },
    index: {
      content: `import { Server } from './network'

Server.start()
`,
      file: `${projectName}/src/index.ts`
    }
  }

  const expressData = {
    network: {
      response: {
        content: `interface ResponseProps {
  error: boolean
  message: unknown
  res: CustomResponse
  status: number
}

const response = ({ error, message, res, status }: ResponseProps): void => {
  res.status(status).send({ error, message })
}

export { response }
`,
        file: `${projectName}/src/network/response.ts`
      },
      router: {
        content: `import { Application, Response, Request, Router, NextFunction } from 'express'
import swaggerUi from 'swagger-ui-express'
import httpErrors from 'http-errors'

import { response } from './response'
import { Home, User } from './routes'
import { docs } from 'utils'

const routers = [User]

const applyRoutes = (app: Application): void => {
  app.use('/', Home)
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(docs))
  routers.forEach((router: Router): Application => app.use('/api', router))

  // Handling 404 error
  app.use((req, res, next) => {
    next(new httpErrors.NotFound('This route does not exists'))
  })
  app.use(
    (
      error: httpErrors.HttpError,
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      response({
        error: true,
        message: error.message,
        res,
        status: error.status
      })
      next()
    }
  )
}

export { applyRoutes }
`,
        file: `${projectName}/src/network/router.ts`
      },
      server: {
        content: `import express from 'express'
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
      console.log(\`Server running at port \${PORT}\`)
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
`,
        file: `${projectName}/src/network/server.ts`
      }
    },
    '@types/custom': {
      request: {
        content: `type ExpressRequest = import('express').Request

interface CustomRequest extends ExpressRequest {
  body: {
    args?: DtoUser
  }
  // We can add custom headers via intersection, remember that for some reason
  // headers must be in Snake-Pascal-Case
  headers: import('http').IncomingHttpHeaders & {
    'Custom-Header'?: string
  }
}
`,
        file: `${projectName}/src/@types/custom/request.d.ts`
      },
      response: {
        content: `type ExpressResponse = import('express').Response

interface CustomResponse extends ExpressResponse {
  newValue?: string
}
`,
        file: `${projectName}/src/@types/custom/response.d.ts`
      }
    },
    'network/routes': {
      home: {
        content: `import { Response, Request, Router } from 'express'

import { response } from 'network/response'

const Home = Router()

Home.route('').get((req: Request, res: Response) => {
  response({
    error: false,
    message: 'Welcome to your Express Backend!',
    res,
    status: 200
  })
})

export { Home }
`,
        file: `${projectName}/src/network/routes/home.ts`
      },
      index: {
        content: `export * from './home'
export * from './user'
`,
        file: `${projectName}/src/network/routes/index.ts`
      },
      user: {
        content: `import { Router, NextFunction } from 'express'
import httpErrors from 'http-errors'
import { ValidationError } from 'joi'

import { response } from 'network/response'
import { UserService } from 'services/user'
import { idSchema, userSchema, storeUserSchema } from './schemas'

const User = Router()

User.route('/users')
  .post(
    async (
      req: CustomRequest,
      res: CustomResponse,
      next: NextFunction
    ): Promise<void> => {
      const {
        body: { args }
      } = req

      try {
        await storeUserSchema.validateAsync(args)
        const us = new UserService(args)
        const result = await us.process({ type: 'store' })
        response({ error: false, message: result, res, status: 201 })
      } catch (e) {
        if (e instanceof ValidationError)
          return next(new httpErrors.UnprocessableEntity(e.message))

        next(e)
      }
    }
  )
  .get(
    async (
      req: CustomRequest,
      res: CustomResponse,
      next: NextFunction
    ): Promise<void> => {
      const us = new UserService()

      try {
        const result = await us.process({ type: 'getAll' })
        response({ error: false, message: result, res, status: 200 })
      } catch (e) {
        next(e)
      }
    }
  )
  .delete(
    async (
      req: CustomRequest,
      res: CustomResponse,
      next: NextFunction
    ): Promise<void> => {
      const us = new UserService()

      try {
        const result = await us.process({ type: 'deleteAll' })
        response({ error: false, message: result, res, status: 200 })
      } catch (e) {
        next(e)
      }
    }
  )

User.route('/user/:id')
  .get(
    async (
      req: CustomRequest,
      res: CustomResponse,
      next: NextFunction
    ): Promise<void> => {
      const {
        params: { id }
      } = req

      try {
        await idSchema.validateAsync(id)
        const us = new UserService({ id })
        const result = await us.process({ type: 'getOne' })
        response({ error: false, message: result, res, status: 200 })
      } catch (e) {
        if (e instanceof ValidationError)
          return next(new httpErrors.UnprocessableEntity(e.message))

        next(e)
      }
    }
  )
  .patch(
    async (
      req: CustomRequest,
      res: CustomResponse,
      next: NextFunction
    ): Promise<void> => {
      const {
        body: { args },
        params: { id }
      } = req
      const user = {
        id,
        ...args
      }

      try {
        await userSchema.validateAsync(user)
        const us = new UserService(user)
        const result = await us.process({ type: 'update' })
        response({ error: false, message: result, res, status: 200 })
      } catch (e) {
        if (e instanceof ValidationError)
          return next(new httpErrors.UnprocessableEntity(e.message))

        next(e)
      }
    }
  )
  .delete(
    async (
      req: CustomRequest,
      res: CustomResponse,
      next: NextFunction
    ): Promise<void> => {
      const {
        params: { id }
      } = req

      try {
        await idSchema.validateAsync(id)
        const us = new UserService({ id })
        const result = await us.process({ type: 'delete' })
        response({ error: false, message: result, res, status: 200 })
      } catch (e) {
        if (e instanceof ValidationError)
          return next(new httpErrors.UnprocessableEntity(e.message))

        next(e)
      }
    }
  )

export { User }
`,
        file: `${projectName}/src/network/routes/user.ts`
      }
    },
    'network/routes/schemas': {
      index: {
        content: `import Joi from 'joi'

const idSchema = Joi.string().length(24).required()

export { idSchema }
export * from './user'
`,
        file: `${projectName}/src/network/routes/schemas/index.ts`
      },
      user: {
        content: `import Joi from 'joi'

const userSchema = Joi.object().keys({
  id: Joi.string().length(24).required(),
  lastName: Joi.string().required(),
  name: Joi.string().required()
})

const storeUserSchema = Joi.object().keys({
  lastName: Joi.string().required(),
  name: Joi.string().required()
})

export { userSchema, storeUserSchema }
`,
        file: `${projectName}/src/network/routes/schemas/user.ts`
      }
    },
    utils: {
      docs: {
        content: `{
  "openapi": "3.0.0",
  "info": {
    "title": "${projectName}",
    "description": "Documentation of the test",
    "contact": {
      "email": "${email}"
    },
    "license": {
      "name": "MIT",
      "url": "https://opensource.org/licenses/MIT"
    },
    "version": "${projectVersion}"
  },
  "servers": [
    {
      "url": "http://localhost:1996/api",
      "description": "${projectName} local API"
    }
  ],
  "tags": [
    {
      "name": "user",
      "description": "Operations related to the user"
    }
  ],
  "paths": {
    "/users": {
      "post": {
        "tags": [
          "user"
        ],
        "summary": "Save a user in the database",
        "operationId": "store",
        "requestBody": {
          "$ref": "#/components/requestBodies/DtoUser"
        },
        "responses": {
          "201": {
            "description": "User successfully stored",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/User"
                }
              }
            }
          },
          "422": {
            "description": "Invalid request format",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DefaultError"
                }
              }
            }
          },
          "500": {
            "description": "Internal server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DefaultError"
                }
              }
            }
          }
        }
      },
      "get": {
        "tags": [
          "user"
        ],
        "summary": "Get all the users in the database",
        "operationId": "getAll",
        "responses": {
          "200": {
            "description": "All the users in the database",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": {
                      "type": "boolean",
                      "default": false
                    },
                    "message": {
                      "type": "object",
                      "properties": {
                        "result": {
                          "type": "array",
                          "items": {
                            "$ref": "#/components/schemas/User"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "500": {
            "description": "Internal server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DefaultError"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "user"
        ],
        "summary": "Delete all the users in the database",
        "operationId": "deleteAll",
        "responses": {
          "200": {
            "description": "All the users in the database",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DefaultSuccess"
                }
              }
            }
          },
          "500": {
            "description": "Internal server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DefaultError"
                }
              }
            }
          }
        }
      }
    },
    "/user/{id}": {
      "get": {
        "tags": [
          "user"
        ],
        "summary": "Get an specific user",
        "operationId": "getOne",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "MongoDB user id",
            "required": true,
            "style": "simple",
            "explode": false,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "User stored in the database",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/User"
                }
              }
            }
          },
          "404": {
            "description": "User not found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DefaultError"
                }
              }
            }
          },
          "422": {
            "description": "Invalid request format",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DefaultError"
                }
              }
            }
          },
          "500": {
            "description": "Internal server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DefaultError"
                }
              }
            }
          }
        }
      },
      "patch": {
        "tags": [
          "user"
        ],
        "summary": "Update the user data",
        "operationId": "update",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "MongoDB user id",
            "required": true,
            "style": "simple",
            "explode": false,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "$ref": "#/components/requestBodies/DtoUser"
        },
        "responses": {
          "200": {
            "description": "User successfully updated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/User"
                }
              }
            }
          },
          "404": {
            "description": "User not found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DefaultError"
                }
              }
            }
          },
          "422": {
            "description": "Invalid request format",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DefaultError"
                }
              }
            }
          },
          "500": {
            "description": "Internal server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DefaultError"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "user"
        ],
        "summary": "Delete one user from the database",
        "operationId": "delete",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "MongoDB user id",
            "required": true,
            "style": "simple",
            "explode": false,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "User successfully deleted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DefaultSuccess"
                }
              }
            }
          },
          "404": {
            "description": "User not found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DefaultError"
                }
              }
            }
          },
          "422": {
            "description": "Invalid request format",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DefaultError"
                }
              }
            }
          },
          "500": {
            "description": "Internal server error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DefaultError"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "User": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "lastName": {
            "type": "string"
          },
          "name": {
            "type": "string"
          }
        }
      },
      "DefaultSuccess": {
        "type": "object",
        "properties": {
          "error": {
            "type": "boolean",
            "default": false
          },
          "message": {
            "type": "object",
            "properties": {
              "result": {
                "type": "string"
              }
            }
          }
        }
      },
      "DefaultError": {
        "type": "object",
        "properties": {
          "error": {
            "type": "boolean",
            "default": true
          },
          "message": {
            "type": "object",
            "properties": {
              "result": {
                "type": "string"
              }
            }
          }
        }
      }
    },
    "requestBodies": {
      "DtoUser": {
        "description": "User name and last name",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "args": {
                  "type": "object",
                  "properties": {
                    "name": {
                      "type": "string"
                    },
                    "lastName": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          }
        },
        "required": true
      }
    }
  }
}`,
        file: `${projectName}/src/utils/docs.json`
      },
      index: {
        content: "export { default as docs } from './docs.json'\n",
        file: `${projectName}/src/utils/index.ts`
      }
    }
  }

  const fastifyData = {
    network: {
      response: {
        content: `import { FastifyReply } from 'fastify'

const response = ({
  error,
  message,
  reply,
  status
}: {
  error: boolean
  message: unknown
  reply: FastifyReply
  status: number
}): void => {
  reply.code(status).send({ error, message })
}

export { response }
`,
        file: `${projectName}/src/network/response.ts`
      },
      router: {
        content: `import { FastifyInstance } from 'fastify'
import { HttpError } from 'http-errors'

import { response } from './response'
import { Home, User, Docs } from './routes'

const routers = [Docs, User]

const applyRoutes = (app: FastifyInstance): void => {
  Home(app)
  routers.forEach(router => router(app))

  // Handling 404 error
  app.setNotFoundHandler((request, reply) => {
    response({
      error: true,
      message: 'This route does not exists',
      reply,
      status: 404
    })
  })
  app.setErrorHandler<HttpError>((error, request, reply) => {
    response({
      error: true,
      message: error.message,
      reply,
      status: error.status ?? 500
    })
  })
}

export { applyRoutes }
`,
        file: `${projectName}/src/network/router.ts`
      },
      server: {
        content: `import Fastify, { FastifyInstance } from 'fastify'
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
`,
        file: `${projectName}/src/network/server.ts`
      }
    },
    'network/routes': {
      docs: {
        content: `import { FastifyInstance } from 'fastify'
import fastifySwagger from 'fastify-swagger'

const Docs = (app: FastifyInstance, prefix = '/api'): void => {
  app.register(fastifySwagger, {
    routePrefix: \`\${prefix}/docs\`,
    openapi: {
      info: {
        title: 'Test swagger',
        description: 'Testing the Fastify swagger API',
        version: '0.1.0',
        contact: {
          email: 'sluzquinosa@uni.pe'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        }
      },
      servers: [
        {
          url: 'http://localhost:1996/api',
          description: 'test-fastify local API'
        }
      ],
      tags: [
        {
          name: 'user',
          description: 'User related endpoints'
        }
      ]
    },
    exposeRoute: true
  })
}

export { Docs }
`,
        file: `${projectName}/src/network/routes/docs.ts`
      },
      home: {
        content: `import { FastifyInstance } from 'fastify'
import { response } from 'network/response'

const Home = (app: FastifyInstance, prefix = '/'): void => {
  app.get(\`\${prefix}\`, (request, reply) => {
    response({
      error: false,
      message: 'Welcome to your Fastify Backend!',
      reply,
      status: 200
    })
  })
}

export { Home }
`,
        file: `${projectName}/src/network/routes/home.ts`
      },
      index: {
        content: `export * from './home'
export * from './user'
export * from './docs'
`,
        file: `${projectName}/src/network/routes/index.ts`
      },
      user: {
        content: `import { FastifyInstance } from 'fastify'

import { response } from 'network/response'
import { userSchema, idSchema, storeUserSchema } from './schemas'
import { UserService } from 'services'

const User = (app: FastifyInstance, prefix = '/api'): void => {
  app
    .post<{ Body: { args: Omit<DtoUser, 'id'> } }>(
      \`\${prefix}/users\`,
      {
        schema: {
          body: {
            args: storeUserSchema
          },
          response: {
            200: {
              error: {
                type: 'boolean'
              },
              message: userSchema
            }
          },
          tags: ['user']
        }
      },
      async (request, reply) => {
        const {
          body: {
            args: { lastName, name }
          }
        } = request
        const us = new UserService({ lastName, name })
        const user = await us.process({ type: 'store' })

        response({
          error: false,
          message: user,
          reply,
          status: 200
        })
      }
    )
    .get(
      \`\${prefix}/users\`,
      {
        schema: {
          response: {
            200: {
              error: {
                type: 'boolean'
              },
              message: {
                type: 'array',
                items: userSchema
              }
            }
          },
          tags: ['user']
        }
      },
      async (request, reply) => {
        const us = new UserService()
        const users = await us.process({ type: 'getAll' })

        response({
          error: false,
          message: users,
          reply,
          status: 200
        })
      }
    )
    .delete(
      \`\${prefix}/users\`,
      {
        schema: {
          response: {
            200: {
              error: {
                type: 'boolean'
              },
              message: {
                type: 'string'
              }
            }
          },
          tags: ['user']
        }
      },
      async (request, reply) => {
        const us = new UserService()
        const result = await us.process({ type: 'deleteAll' })

        response({
          error: false,
          message: result,
          reply,
          status: 200
        })
      }
    )
    .get<{ Params: { id: string } }>(
      \`\${prefix}/user/:id\`,
      {
        schema: {
          params: {
            id: idSchema
          },
          response: {
            200: {
              error: {
                type: 'boolean'
              },
              message: userSchema
            }
          },
          tags: ['user']
        }
      },
      async (request, reply) => {
        const {
          params: { id }
        } = request
        const us = new UserService({ id })
        const user = await us.process({ type: 'getOne' })

        response({
          error: false,
          message: user,
          reply,
          status: 200
        })
      }
    )
    .patch<{ Body: { args: Omit<DtoUser, 'id'> }; Params: { id: string } }>(
      \`\${prefix}/user/:id\`,
      {
        schema: {
          body: {
            args: userSchema
          },
          params: {
            id: idSchema
          },
          response: {
            200: {
              error: {
                type: 'boolean'
              },
              message: userSchema
            }
          },
          tags: ['user']
        }
      },
      async (request, reply) => {
        const {
          body: {
            args: { name, lastName }
          },
          params: { id }
        } = request
        const us = new UserService({ name, lastName, id })
        const user = await us.process({ type: 'update' })

        response({
          error: false,
          message: user,
          reply,
          status: 200
        })
      }
    )
    .delete<{ Params: { id: string } }>(
      \`\${prefix}/user/:id\`,
      {
        schema: {
          params: {
            id: idSchema
          },
          response: {
            200: {
              error: {
                type: 'boolean'
              },
              message: {
                type: 'string'
              }
            }
          },
          tags: ['user']
        }
      },
      async (request, reply) => {
        const {
          params: { id }
        } = request
        const us = new UserService({ id })
        const result = await us.process({ type: 'delete' })

        response({
          error: false,
          message: result,
          reply,
          status: 200
        })
      }
    )
}

export { User }
`,
        file: `${projectName}/src/network/routes/user.ts`
      }
    },
    'network/routes/schemas': {
      index: {
        content: `import { Type } from '@sinclair/typebox'

const idSchema = Type.String({ minLength: 24, maxLength: 24 })

export { idSchema }
export * from './user'
`,
        file: `${projectName}/src/network/routes/schemas/index.ts`
      },
      user: {
        content: `import { Type } from '@sinclair/typebox'

const userSchema = Type.Object({
  id: Type.Optional(Type.String({ minLength: 24, maxLength: 24 })),
  lastName: Type.Optional(Type.String()),
  name: Type.Optional(Type.String()),
  updatedAt: Type.Optional(Type.String())
})

const storeUserSchema = Type.Object({
  lastName: Type.String(),
  name: Type.String()
})

export { userSchema, storeUserSchema }
`,
        file: `${projectName}/src/network/routes/schemas/user.ts`
      }
    }
  }

  const expressFolders = `${projectName}/src/utils`

  const createFoldersCommands = `mkdir ${projectName}/src \
${projectName}/src/@types \
${projectName}/src/@types/dto \
${projectName}/src/@types/custom \
${projectName}/src/@types/models \
${projectName}/src/database \
${projectName}/src/database/mongo \
${projectName}/src/database/mongo/models \
${projectName}/src/database/mongo/queries \
${projectName}/src/network \
${projectName}/src/network/routes \
${projectName}/src/network/routes/schemas \
${projectName}/src/services \
${projectName}/src/services/utils \
${projectName}/src/services/utils/messages \
${fastify ? '' : `${expressFolders}`}
`

  if (os.platform() === 'win32')
    await exec(createFoldersCommands.replaceAll('/', '\\'))
  else await exec(createFoldersCommands)

  // /@types
  await writeFile(data['@types'].index.file, data['@types'].index.content)

  // /@types/dto
  await writeFile(data['@types/dto'].user.file, data['@types/dto'].user.content)

  // /@types/models
  await writeFile(
    data['@types/models'].user.file,
    data['@types/models'].user.content
  )

  // /services
  await writeFile(data.services.user.file, data.services.user.content)
  await writeFile(data.services.index.file, data.services.index.content)

  // /database
  await writeFile(data.database.index.file, data.database.index.content)
  await writeFile(
    data['database/mongo'].index.file,
    data['database/mongo'].index.content
  )
  await writeFile(
    data['database/mongo/models'].index.file,
    data['database/mongo/models'].index.content
  )
  await writeFile(
    data['database/mongo/models'].user.file,
    data['database/mongo/models'].user.content
  )
  await writeFile(
    data['database/mongo/queries'].index.file,
    data['database/mongo/queries'].index.content
  )
  await writeFile(
    data['database/mongo/queries'].user.file,
    data['database/mongo/queries'].user.content
  )

  // /services/utils
  await writeFile(
    data['services/utils'].index.file,
    data['services/utils'].index.content
  )

  // /services/utils/messages
  await writeFile(
    data['services/utils/messages'].user.file,
    data['services/utils/messages'].user.content
  )
  await writeFile(
    data['services/utils/messages'].index.file,
    data['services/utils/messages'].index.content
  )

  // /network
  await writeFile(data.network.index.file, data.network.index.content)

  // /test
  await writeFile(data.test.index.file, data.test.index.content)

  // .env
  await writeFile(data['.env'].file, data['.env'].content)

  // index
  await writeFile(data.index.file, data.index.content)

  if (fastify) {
    // /network
    await writeFile(
      fastifyData.network.response.file,
      fastifyData.network.response.content
    )
    await writeFile(
      fastifyData.network.router.file,
      fastifyData.network.router.content
    )
    await writeFile(
      fastifyData.network.server.file,
      fastifyData.network.server.content
    )

    // /network/routes
    await writeFile(
      fastifyData['network/routes'].docs.file,
      fastifyData['network/routes'].docs.content
    )
    await writeFile(
      fastifyData['network/routes'].home.file,
      fastifyData['network/routes'].home.content
    )
    await writeFile(
      fastifyData['network/routes'].user.file,
      fastifyData['network/routes'].user.content
    )
    await writeFile(
      fastifyData['network/routes'].index.file,
      fastifyData['network/routes'].index.content
    )

    // /network/routes/schemas
    await writeFile(
      fastifyData['network/routes/schemas'].index.file,
      fastifyData['network/routes/schemas'].index.content
    )
    await writeFile(
      fastifyData['network/routes/schemas'].user.file,
      fastifyData['network/routes/schemas'].user.content
    )
  } else {
    // /network
    await writeFile(
      expressData.network.response.file,
      expressData.network.response.content
    )
    await writeFile(
      expressData.network.router.file,
      expressData.network.router.content
    )
    await writeFile(
      expressData.network.server.file,
      expressData.network.server.content
    )

    // /network/routes
    await writeFile(
      expressData['network/routes'].home.file,
      expressData['network/routes'].home.content
    )
    await writeFile(
      expressData['network/routes'].user.file,
      expressData['network/routes'].user.content
    )
    await writeFile(
      expressData['network/routes'].index.file,
      expressData['network/routes'].index.content
    )

    // /network/routes/schemas
    await writeFile(
      expressData['network/routes/schemas'].index.file,
      expressData['network/routes/schemas'].index.content
    )
    await writeFile(
      expressData['network/routes/schemas'].user.file,
      expressData['network/routes/schemas'].user.content
    )

    // /utils
    await writeFile(expressData.utils.docs.file, expressData.utils.docs.content)
    await writeFile(
      expressData.utils.index.file,
      expressData.utils.index.content
    )

    // /@types/custom
    await writeFile(
      expressData['@types/custom'].request.file,
      expressData['@types/custom'].request.content
    )
    await writeFile(
      expressData['@types/custom'].response.file,
      expressData['@types/custom'].response.content
    )
  }
}
