const util = require('util')
const exec = util.promisify(require('child_process').exec)
const writeFile = require('../utils/writeFile')

/*
 * src
 * |- @types:
 * |  |- global: content, file
 * |- controllers:
 * |  |- utils:
 * |  |  |- messages:
 * |  |  |  |- user: content, file
 * |  |  |  |- index: content, file
 * |  |  |- index: content, file
 * |  |- user: content, file
 * |  |- index: content, file
 * |- dto-interfaces:
 * |  |- user: content, file
 * |  |- index: content, file
 * |- models:
 * |  |- user: content, file
 * |  |- index: content, file
 * |- network:
 * |  |- server: content, file
 * |  |- routes: content, file
 * |  |- index: content, file
 * |- routes:
 * |  |- home: content, file
 * |  |- user: content, file
 * |  |- index: content, file
 * |- schemas:
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
import { IncomingHttpHeaders } from 'http'
import { Request, Response } from 'express'

import { DtoUser } from 'dto-interfaces'

declare global {
  // This variable is global, so it will be available everywhere in the code
  var response = (
    error: boolean,
    message: unknown,
    res: Response,
    status: number
  ): void => {
    res.status(status).send({ error, message })
  }

  // We can personalize the response and request objects in case we need it by
  // adding new optional attributes to this interface
  interface CustomResponse extends Response {
    newValue?: string
  }

  interface CustomRequest extends Request {
    body: {
      args?: DtoUser
    }
    // We can add custom headers via intersection, remember that for some reason
    // headers must be in Snake-Pascal-Case
    headers: IncomingHttpHeaders & {
      'Custom-Header'?: string
    }
  }
}

export {}
`,
        file: `${projectName}/src/@types/index.d.ts`
      }
    },
    controllers: {
      index: {
        content: `import { User } from './user'

export { User }
`,
        file: `${projectName}/src/controllers/index.ts`
      },
      user: {
        content: `import httpErrors from 'http-errors'

import { DtoUser } from 'dto-interfaces'
import { IUser, UserModel } from 'models'
import { EFU, MFU, GE, errorHandling } from './utils'

type Process = {
  type: 'store' | 'getAll' | 'deleteAll' | 'getOne' | 'update' | 'delete'
}

class User {
  private _args: DtoUser | null

  constructor(args: DtoUser | null = null) {
    this._args = args
  }

  public process({
    type
  }: Process): Promise<string> | Promise<IUser[]> | Promise<IUser> {
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
    const { lastName, name } = this._args as DtoUser

    try {
      const newUser = new UserModel({ lastName, name })
      const result = await newUser.save()

      return result
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  private async _getAll(): Promise<IUser[]> {
    try {
      const users = await UserModel.find({})

      return users
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  private async _deleteAll(): Promise<string> {
    try {
      const usersDeleted = await UserModel.deleteMany({})

      if (usersDeleted.acknowledged) return MFU.ALL_USERS_DELETED

      throw new httpErrors.InternalServerError(GE.INTERNAL_SERVER_ERROR)
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  private async _getOne(): Promise<IUser> {
    const { id } = this._args as DtoUser

    try {
      const user = await UserModel.findById(id)

      if (!user) throw new httpErrors.NotFound(EFU.NOT_FOUND)

      return user
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  private async _update(): Promise<IUser> {
    const { id, lastName, name } = this._args as DtoUser

    try {
      const updatedUser = await UserModel.findByIdAndUpdate(
        id,
        { lastName, name },
        { new: true }
      )

      if (!updatedUser) throw new httpErrors.NotFound(EFU.NOT_FOUND)

      return updatedUser
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  private async _delete(): Promise<string> {
    const { id } = this._args as DtoUser

    try {
      const deletedUser = await UserModel.findByIdAndRemove(id)

      if (!deletedUser) throw new httpErrors.NotFound(EFU.NOT_FOUND)

      return MFU.USER_DELETED
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }
}

export { User }
`,
        file: `${projectName}/src/controllers/user.ts`
      }
    },
    'controllers/utils': {
      index: {
        content: `import httpErrors from 'http-errors'

import { EFU, MFU, GE } from './messages'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errorHandling = (e: any, message?: string): never => {
  console.error(e)

  if (e instanceof httpErrors.HttpError) throw e

  throw new httpErrors.InternalServerError(message ?? e.message)
}

export { EFU, MFU, GE, errorHandling }
`,
        file: `${projectName}/src/controllers/utils/index.ts`
      }
    },
    'controllers/utils/messages': {
      index: {
        content: `import { EFU, MFU } from './user'

enum GenericErrors {
  INTERNAL_SERVER_ERROR = 'Something went wrong'
}

export { EFU, MFU, GenericErrors as GE }
`,
        file: `${projectName}/src/controllers/utils/messages/index.ts`
      },
      user: {
        content: `enum ErrorForUser {
  NOT_FOUND = 'The requested user does not exists'
}

enum MessageForUser {
  ALL_USERS_DELETED = 'All the users were deleted successfully',
  USER_DELETED = 'The requested user was successfully deleted'
}

export { ErrorForUser as EFU, MessageForUser as MFU }
`,
        file: `${projectName}/src/controllers/utils/messages/user.ts`
      }
    },
    'dto-interfaces': {
      index: {
        content: `import { DtoUser } from './user'

export { DtoUser }
`,
        file: `${projectName}/src/dto-interfaces/index.ts`
      },
      user: {
        content: `interface DtoUser {
  id: string
  lastName?: string
  name?: string
}

export { DtoUser }
`,
        file: `${projectName}/src/dto-interfaces/user.ts`
      }
    },
    models: {
      index: {
        content: `import { IUser, UserModel } from './user'

export { IUser, UserModel }
`,
        file: `${projectName}/src/models/index.ts`
      },
      user: {
        content: `/* eslint-disable no-underscore-dangle */
import { Document, model, Schema } from 'mongoose'

interface IUser extends Document {
  lastName: string
  name: string
  updatedAt: Date
}

const User = new Schema(
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
    }
  }
)

User.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: function (_: any, ret: any) {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    delete ret.updatedAt
  },
  versionKey: false,
  virtuals: true
})

const UserModel = model<IUser>('users', User)

export { IUser, UserModel }
`,
        file: `${projectName}/src/models/user.ts`
      }
    },
    network: {
      routes: {
        content: `import { Application, Response, Request, Router, NextFunction } from 'express'
import swaggerUi from 'swagger-ui-express'
import httpErrors from 'http-errors'

import { Home, User } from 'routes'
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
      response(true, error.message, res, error.status)
      next()
    }
  )
}

export { applyRoutes }
`,
        file: `${projectName}/src/network/routes.ts`
      },
      server: {
        content: `import express from 'express'
import mongoose from 'mongoose'
import morgan from 'morgan'

import { applyRoutes } from './routes'

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
      useCreateIndex: true,
      useFindAndModify: false,
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
      },
      index: {
        content: `import { applyRoutes } from './routes'
import { Server } from './server'

export { applyRoutes, Server }
`,
        file: `${projectName}/src/network/index.ts`
      }
    },
    routes: {
      home: {
        content: `import { Response, Request, Router } from 'express'

const Home = Router()

Home.route('').get((req: Request, res: Response) => {
  response(false, 'Welcome to your Express Backend!', res, 200)
})

export { Home }
`,
        file: `${projectName}/src/routes/home.ts`
      },
      index: {
        content: `import { Home } from './home'
import { User } from './user'

export { Home, User }
`,
        file: `${projectName}/src/routes/index.ts`
      },
      user: {
        content: `import { Router, NextFunction } from 'express'
import httpErrors from 'http-errors'
import { ValidationError } from 'joi'

import { User as UserC } from 'controllers/user'
import { DtoUser } from 'dto-interfaces'
import { idSchema, userSchema } from 'schemas'

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
      const u = new UserC(args as DtoUser)

      try {
        const result = await u.process({ type: 'store' })
        response(false, result, res, 201)
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
      const u = new UserC()

      try {
        const result = await u.process({ type: 'getAll' })
        response(false, result, res, 200)
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
      const u = new UserC()

      try {
        const result = await u.process({ type: 'deleteAll' })
        response(false, result, res, 200)
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
        const u = new UserC({ id } as DtoUser)
        const result = await u.process({ type: 'getOne' })
        response(false, result, res, 200)
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
        const u = new UserC(user)
        const result = await u.process({ type: 'update' })
        response(false, result, res, 200)
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
        const u = new UserC({ id } as DtoUser)
        const result = await u.process({ type: 'delete' })
        response(false, result, res, 200)
      } catch (e) {
        if (e instanceof ValidationError)
          return next(new httpErrors.UnprocessableEntity(e.message))

        next(e)
      }
    }
  )

export { User }
`,
        file: `${projectName}/src/routes/user.ts`
      }
    },
    schemas: {
      index: {
        content: `import Joi from 'joi'

import { userSchema } from './user'

const idSchema = Joi.string().length(24).required()

export { idSchema, userSchema }
`,
        file: `${projectName}/src/schemas/index.ts`
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
        file: `${projectName}/src/schemas/user.ts`
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
        content: `import docs from './docs.json'

export { docs }
`,
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

  await exec(`mkdir ${projectName}/src \
${projectName}/src/@types \
${projectName}/src/controllers \
${projectName}/src/controllers/utils \
${projectName}/src/controllers/utils/messages \
${projectName}/src/dto-interfaces \
${projectName}/src/models \
${projectName}/src/network \
${projectName}/src/routes \
${projectName}/src/schemas \
${projectName}/src/test \
${projectName}/src/utils
`)

  // /@types
  await writeFile(data['@types'].index.file, data['@types'].index.content)

  // /controllers
  await writeFile(data.controllers.user.file, data.controllers.user.content)
  await writeFile(data.controllers.index.file, data.controllers.index.content)

  // /controllers/utils
  await writeFile(
    data['controllers/utils'].index.file,
    data['controllers/utils'].index.content
  )

  // /controllers/utils/messages
  await writeFile(
    data['controllers/utils/messages'].user.file,
    data['controllers/utils/messages'].user.content
  )
  await writeFile(
    data['controllers/utils/messages'].index.file,
    data['controllers/utils/messages'].index.content
  )

  // /dto-interfaces
  await writeFile(
    data['dto-interfaces'].user.file,
    data['dto-interfaces'].user.content
  )
  await writeFile(
    data['dto-interfaces'].index.file,
    data['dto-interfaces'].index.content
  )

  // /models
  await writeFile(data.models.user.file, data.models.user.content)
  await writeFile(data.models.index.file, data.models.index.content)

  // /network
  await writeFile(data.network.routes.file, data.network.routes.content)
  await writeFile(data.network.server.file, data.network.server.content)
  await writeFile(data.network.index.file, data.network.index.content)

  // /routes
  await writeFile(data.routes.home.file, data.routes.home.content)
  await writeFile(data.routes.user.file, data.routes.user.content)
  await writeFile(data.routes.index.file, data.routes.index.content)

  // /schemas
  await writeFile(data.schemas.index.file, data.schemas.index.content)
  await writeFile(data.schemas.user.file, data.schemas.user.content)

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
