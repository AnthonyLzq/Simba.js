const os = require('os')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const writeFile = require('../utils/writeFile')

/*
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
 * |  |  |- response: content, file
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
 * |- test:
 * |  |- index.http: content, file
 * |- utils:
 * |  |- docs.json: content, file
 * |  |- index: content, file
 * |- .env: content, file
 * |- index: content, file
 */

/**
 * @param {String} projectName
 * @param {String} projectVersion
 * @param {String} email
 */
module.exports = async (projectName, projectVersion, email) => {
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
  id?: string
  lastName?: string
  name?: string
}
`,
        file: `${projectName}/src/@types/dto/user.d.ts`
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
    '@types/models': {
      user: {
        content: `interface IUser {
  _id: import('mongoose').Types.ObjectId
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
    toJSON: {
      transform(_, ret) {
        ret.id = ret._id
        delete ret._id
        delete ret.__v
        delete ret.updatedAt
      },
      versionKey: false,
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
        content: `import { UserModel } from '../models'

const store = async (userData: DtoUser): Promise<IUser> => {
  const user = new UserModel(userData)

  return await user.save()
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
  if (id) return await UserModel.findById(id)

  return await UserModel.find({})
}

const update = async (userData: DtoUser): Promise<IUser | null> => {
  const { id, ...rest } = userData

  return await UserModel.findByIdAndUpdate(id, rest, { new: true })
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
      },
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
import { idSchema, userSchema } from './schemas'

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
      const us = new UserService(args as DtoUser)

      try {
        const result = await us.process({ type: 'store' })
        response({ error: false, message: result, res, status: 201 })
      } catch (e) {
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
        const us = new UserService({ id } as DtoUser)
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
      const user: DtoUser = {
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
        const us = new UserService({ id } as DtoUser)
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

export { userSchema }
`,
        file: `${projectName}/src/network/routes/schemas/user.ts`
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
  private _args: DtoUser | null

  constructor(args: DtoUser | null = null) {
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
        file: `${projectName}/src/test/index.http`
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
    },
    '.env': {
      content: `MONGO_URI = mongodb://mongo:mongo@mongo:27017/${projectName}`,
      file: `${projectName}/.env`
    },
    index: {
      content: `import { Server } from './network'

Server.start()
`,
      file: `${projectName}/src/index.ts`
    }
  }

  const createFoldersCommands = `mkdir ${projectName}/src \
${projectName}/src/@types \
${projectName}/src/@types/dto \
${projectName}/src/@types/custom \
${projectName}/src/@types/models \
${projectName}/src/services \
${projectName}/src/services/utils \
${projectName}/src/services/utils/messages \
${projectName}/src/database \
${projectName}/src/database/mongo \
${projectName}/src/database/mongo/models \
${projectName}/src/database/mongo/queries \
${projectName}/src/network \
${projectName}/src/network/routes \
${projectName}/src/network/routes/schemas \
${projectName}/src/test \
${projectName}/src/utils
`

  if (os.platform() === 'win32')
    await exec(createFoldersCommands.replaceAll('/', '\\'))
  else await exec(createFoldersCommands)

  // /@types
  await writeFile(data['@types'].index.file, data['@types'].index.content)

  // /@types/custom
  await writeFile(
    data['@types/custom'].request.file,
    data['@types/custom'].request.content
  )
  await writeFile(
    data['@types/custom'].response.file,
    data['@types/custom'].response.content
  )

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
  await writeFile(data.network.response.file, data.network.response.content)
  await writeFile(data.network.router.file, data.network.router.content)
  await writeFile(data.network.server.file, data.network.server.content)

  // /network/routes
  await writeFile(
    data['network/routes'].home.file,
    data['network/routes'].home.content
  )
  await writeFile(
    data['network/routes'].user.file,
    data['network/routes'].user.content
  )
  await writeFile(
    data['network/routes'].index.file,
    data['network/routes'].index.content
  )

  // /network/routes/schemas
  await writeFile(
    data['network/routes/schemas'].index.file,
    data['network/routes/schemas'].index.content
  )
  await writeFile(
    data['network/routes/schemas'].user.file,
    data['network/routes/schemas'].user.content
  )

  // /test
  await writeFile(data.test.index.file, data.test.index.content)

  // /utils
  await writeFile(data.utils.docs.file, data.utils.docs.content)
  await writeFile(data.utils.index.file, data.utils.index.content)

  // .env
  await writeFile(data['.env'].file, data['.env'].content)

  // index
  await writeFile(data.index.file, data.index.content)
}
