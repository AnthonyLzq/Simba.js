const os = require('os')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const database = require('./database')
const schemas = require('./schemas')
const services = require('./services')
const types = require('./types')
const writeFile = require('../../utils/writeFile')

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
 * @param {Boolean|undefined} args.mongo
 */
module.exports = async ({
  projectName,
  projectVersion,
  email,
  fastify = false,
  mongo = true
}) => {
  const data = {
    network: {
      index: {
        content: `export * from './routes'
export * from './server'
`,
        file: `${projectName}/src/network/index.ts`
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
      console.log(\`Server running at port \${PORT}\`)
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
        content: `import { NextFunction, Router } from 'express'

import { response } from 'network/response'
import { UserService } from 'services'
import { idSchema, storeUserSchema, UserDTO } from 'schemas'
import { validatorCompiler } from './utils'

const User = Router()

User.route('/users')
  .post(
    validatorCompiler(storeUserSchema, 'body'),
    async (
      req: CustomRequest,
      res: CustomResponse,
      next: NextFunction
    ): Promise<void> => {
      try {
        const {
          body: { args }
        } = req
        const us = new UserService({ userDtoWithoutId: args })
        const result = await us.process({ type: 'store' })

        response({ error: false, message: result, res, status: 201 })
      } catch (error) {
        next(error)
      }
    }
  )
  .get(
    async (
      req: CustomRequest,
      res: CustomResponse,
      next: NextFunction
    ): Promise<void> => {
      try {
        const us = new UserService()
        const result = await us.process({ type: 'getAll' })

        response({ error: false, message: result, res, status: 200 })
      } catch (error) {
        next(error)
      }
    }
  )
  .delete(
    async (
      req: CustomRequest,
      res: CustomResponse,
      next: NextFunction
    ): Promise<void> => {
      try {
        const us = new UserService()
        const result = await us.process({ type: 'deleteAll' })

        response({ error: false, message: result, res, status: 200 })
      } catch (error) {
        next(error)
      }
    }
  )

User.route('/user/:id')
  .get(
    validatorCompiler(idSchema, 'params'),
    async (
      req: CustomRequest,
      res: CustomResponse,
      next: NextFunction
    ): Promise<void> => {
      try {
        const {
          params: { id }
        } = req
        const us = new UserService({ id })
        const result = await us.process({ type: 'getOne' })

        response({ error: false, message: result, res, status: 200 })
      } catch (error) {
        next(error)
      }
    }
  )
  .patch(
    validatorCompiler(idSchema, 'params'),
    validatorCompiler(storeUserSchema, 'body'),
    async (
      req: CustomRequest,
      res: CustomResponse,
      next: NextFunction
    ): Promise<void> => {
      try {
        const {
          body: { args },
          params: { id }
        } = req
        const userDto = {
          id,
          ...args
        } as UserDTO
        const us = new UserService({ userDto })
        const result = await us.process({ type: 'update' })

        response({ error: false, message: result, res, status: 200 })
      } catch (error) {
        next(error)
      }
    }
  )
  .delete(
    validatorCompiler(idSchema, 'params'),
    async (
      req: CustomRequest,
      res: CustomResponse,
      next: NextFunction
    ): Promise<void> => {
      try {
        const {
          params: { id }
        } = req
        const us = new UserService({ id })
        const result = await us.process({ type: 'delete' })

        response({ error: false, message: result, res, status: 200 })
      } catch (error) {
        next(error)
      }
    }
  )

export { User }
`,
        file: `${projectName}/src/network/routes/user.ts`
      }
    },
    'network/routes/utils': {
      index: {
        content: `import { NextFunction } from 'express'
import httpErrors from 'http-errors'
import { TObject, TProperties } from '@sinclair/typebox'
import Ajv from 'ajv'

const ajv = new Ajv({
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true,
  nullable: true
})

type Middleware = (
  req: CustomRequest,
  res: CustomResponse,
  next: NextFunction
) => void

const validatorCompiler = <T extends TProperties>(
  schema: TObject<T>,
  value: 'body' | 'params'
): Middleware => {
  return (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
    const validate = ajv.compile(schema)
    const ok = validate(req[value])

    if (!ok && validate.errors) {
      const [error] = validate.errors
      const errorMessage = \`\${error.dataPath.replace('.', '')} \${error.message}\`

      return next(new httpErrors.UnprocessableEntity(errorMessage))
    }

    next()
  }
}

export { validatorCompiler }
`,
        file: `${projectName}/src/network/routes/utils/index.ts`
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
          "$ref": "#/components/requestBodies/UserDTO"
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
          "$ref": "#/components/requestBodies/UserDTO"
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
      "UserDTO": {
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
        content: `import fastify, { FastifyInstance } from 'fastify'
import mongoose from 'mongoose'

import { applyRoutes } from './router'
import { validatorCompiler } from './utils'

const PORT = process.env.PORT ?? '1996'

class Server {
  #app: FastifyInstance
  #connection: mongoose.Connection | undefined

  constructor() {
    this.#app = fastify({ logger: { prettyPrint: true } })
    this.#config()
  }

  #config() {
    this.#app.register(require('fastify-cors'), {})
    this.#app.addHook('preHandler', (req, reply, done) => {
      reply.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
      reply.header('Access-Control-Allow-Origin', '*')
      reply.header(
        'Access-Control-Allow-Headers',
        'Authorization, Content-Type'
      )
      done()
    })
    this.#app.setValidatorCompiler(validatorCompiler)
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
      this.#app.log.info('Mongo connection established.')
    })
    this.#connection.on('reconnected', () => {
      this.#app.log.info('Mongo connection reestablished')
    })
    this.#connection.on('disconnected', () => {
      this.#app.log.info('Mongo connection disconnected')
      this.#app.log.info('Trying to reconnected to Mongo...')
      setTimeout(() => {
        mongoose.connect(process.env.MONGO_URI as string, {
          ...connection,
          connectTimeoutMS: 3000,
          socketTimeoutMS: 3000
        })
      }, 3000)
    })
    this.#connection.on('close', () => {
      this.#app.log.info('Mongo connection closed')
    })
    this.#connection.on('error', (e: Error) => {
      this.#app.log.info('Mongo connection error:')
      this.#app.log.error(e)
    })
    await mongoose.connect(process.env.MONGO_URI as string, connection)
  }

  public async start(): Promise<void> {
    try {
      await this.#app.listen(PORT)
      this.#mongo()
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
import { Type } from '@sinclair/typebox'

import { response } from 'network/response'
import {
  userDto,
  idSchema,
  IdSchema,
  storeUserSchema,
  StoreUser
} from 'schemas'
import { UserService } from 'services'

const User = (app: FastifyInstance, prefix = '/api'): void => {
  app
    .post<{ Body: StoreUser }>(
      \`\${prefix}/users\`,
      {
        schema: {
          body: storeUserSchema,
          response: {
            200: {
              error: {
                type: 'boolean'
              },
              message: userDto
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
        const us = new UserService({
          userDtoWithoutId: { lastName, name }
        })
        const user = await us.process({ type: 'store' })

        response({
          error: false,
          message: user,
          reply,
          status: 201
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
              message: Type.Array(userDto)
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
    .get<{ Params: IdSchema }>(
      \`\${prefix}/user/:id\`,
      {
        schema: {
          params: idSchema,
          response: {
            200: {
              error: {
                type: 'boolean'
              },
              message: userDto
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
    .patch<{ Body: StoreUser; Params: IdSchema }>(
      \`\${prefix}/user/:id\`,
      {
        schema: {
          body: storeUserSchema,
          params: idSchema,
          response: {
            200: {
              error: {
                type: 'boolean'
              },
              message: userDto
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
        const us = new UserService({
          userDto: { name, lastName, id }
        })
        const user = await us.process({ type: 'update' })

        response({
          error: false,
          message: user,
          reply,
          status: 200
        })
      }
    )
    .delete<{ Params: IdSchema }>(
      \`\${prefix}/user/:id\`,
      {
        schema: {
          params: idSchema,
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
    'network/utils': {
      index: {
        content: `/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  FastifyRouteSchemaDef,
  FastifyValidationResult
} from 'fastify/types/schema'
import httpErrors from 'http-errors'
import Ajv from 'ajv'

const ajv = new Ajv({
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true,
  nullable: true
})

const validatorCompiler = ({
  schema
}: FastifyRouteSchemaDef<any>): FastifyValidationResult => {
  const validate = ajv.compile(schema)

  return (data: unknown): boolean => {
    const ok = validate(data)

    if (!ok && validate.errors) {
      const [error] = validate.errors
      const errorMessage = \`\${error.dataPath.replace('.', '')} \${error.message}\`

      throw new httpErrors.UnprocessableEntity(errorMessage)
    }

    return true
  }
}

export { validatorCompiler }
`,
        file: `${projectName}/src/network/utils/index.ts`
      }
    }
  }

  const expressFolders = `${projectName}/src/utils \
${projectName}/src/network/routes/utils`

  const fastifyFolders = `${projectName}/src/network/utils`

  const createFoldersCommands = `mkdir ${projectName}/src \
${projectName}/src/network \
${projectName}/src/network/routes \
${fastify ? `${fastifyFolders}` : `${expressFolders}`}
`

  if (os.platform() === 'win32')
    await exec(createFoldersCommands.replaceAll('/', '\\'))
  else await exec(createFoldersCommands)

  // /@types
  types({
    express: !fastify,
    projectName
  })
  // /database
  database({
    mongo,
    projectName
  })
  // /schemas
  schemas({ projectName })
  // /services
  services({ projectName })

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

    // /network/routes/utils
    await writeFile(
      fastifyData['network/utils'].index.file,
      fastifyData['network/utils'].index.content
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

    // /network/routes/utils
    await writeFile(
      expressData['network/routes/utils'].index.file,
      expressData['network/routes/utils'].index.content
    )

    // /utils
    await writeFile(expressData.utils.docs.file, expressData.utils.docs.content)
    await writeFile(
      expressData.utils.index.file,
      expressData.utils.index.content
    )
  }
}
