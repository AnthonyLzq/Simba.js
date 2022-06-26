const { platform } = require('os')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const writeFile = require('../../utils/writeFile')

/**
 * @param {Object} args
 * @param {String} args.projectName
 */
const expressRestNetwork = async ({ projectName }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/network/routes/utils`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  const network = {
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
      content: `import { Server as HttpServer } from 'http'
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
      this.#log.logger.info(\`Server running at port \${PORT}\`)
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
`,
      file: `${projectName}/src/network/server.ts`
    },
    routes: {
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
import { idSchema, storeUserDto, UserWithId } from 'schemas'
import { validatorCompiler } from './utils'

const User = Router()

User.route('/users')
  .post(
    validatorCompiler(storeUserDto, 'body'),
    async (
      req: CustomRequest,
      res: CustomResponse,
      next: NextFunction
    ): Promise<void> => {
      try {
        const {
          body: { args: user }
        } = req
        const us = new UserService({ user })
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
    validatorCompiler(storeUserDto, 'body'),
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
        const userWithId = {
          id,
          ...args
        } as UserWithId
        const us = new UserService({ userWithId })
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
      },
      utils: {
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
      }
    }
  }

  await Promise.all([
    writeFile(network.response.file, network.response.content),
    writeFile(network.router.file, network.router.content),
    writeFile(network.server.file, network.server.content),
    writeFile(network.routes.home.file, network.routes.home.content),
    writeFile(network.routes.index.file, network.routes.index.content),
    writeFile(network.routes.user.file, network.routes.user.content),
    writeFile(
      network.routes.utils.index.file,
      network.routes.utils.index.content
    )
  ])
}

/**
 * @param {Object} args
 * @param {String} args.projectName
 */
const expressGraphQLNetwork = async ({ projectName }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/network/routes/utils \
${projectName}/src/graphQL/models \
${projectName}/src/graphQL/models/User \
${projectName}/src/graphQL/models/utils \
${projectName}/src/graphQL/models/utils/messages`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  const graphQL = {
    index: {
      content: "export * from './models'\n",
      file: `${projectName}/src/graphQL/index.ts`
    },
    models: {
      User: {
        index: {
          content: `import { makeExecutableSchema } from '@graphql-tools/schema'

import { User as UserTD } from './typeDefs'
import { Query } from './queriesResolver'
import { Mutation } from './mutationsResolver'

const resolvers = {
  Query,
  Mutation
}

const User = makeExecutableSchema({
  typeDefs: UserTD,
  resolvers
})

export { User }
`,
          file: `${projectName}/src/graphQL/models/User/index.ts`
        },
        mutations: {
          content: `import { ApolloError } from 'apollo-server-core'

import { store, remove, update } from 'database'
import { User, UserDTO, UserWithId } from 'schemas'
import { EFU, MFU, GE, errorHandling } from '../utils'

const storeUser = async (
  { user }: { user: User },
  { log }: Context
): Promise<UserDTO> => {
  try {
    const result = await store(user)

    return result
  } catch (e) {
    return errorHandling({
      e,
      message: GE.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      log
    })
  }
}

const deleteAllUsers = async ({ log }: Context): Promise<string> => {
  try {
    const usersDeleted = (await remove()) as number

    if (usersDeleted >= 1) return MFU.ALL_USERS_DELETED

    if (usersDeleted === 0)
      throw new ApolloError(EFU.NOTHING_TO_DELETE, 'NOTHING_TO_DELETE')

    throw new ApolloError(GE.INTERNAL_SERVER_ERROR, 'INTERNAL_SERVER_ERROR')
  } catch (e) {
    return errorHandling({
      e,
      message: GE.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      log
    })
  }
}

const updateUser = async (
  { user }: { user: UserWithId },
  { log }: Context
): Promise<UserDTO> => {
  try {
    const updatedUser = await update(user)

    if (!updatedUser) throw new ApolloError(EFU.NOT_FOUND, 'NOT_FOUND')

    return updatedUser
  } catch (e) {
    return errorHandling({
      e,
      message: GE.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      log
    })
  }
}

const deleteUser = async (
  { id }: { id: string },
  { log }: Context
): Promise<string> => {
  try {
    const deletedUser = await remove(id)

    if (!deletedUser) throw new ApolloError(EFU.NOT_FOUND, 'NOT_FOUND')

    return MFU.USER_DELETED
  } catch (e) {
    return errorHandling({
      e,
      message: GE.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      log
    })
  }
}

export { storeUser, deleteAllUsers, updateUser, deleteUser }
`,
          file: `${projectName}/src/graphQL/models/User/mutations.ts`
        },
        mutationsResolver: {
          content: `import { DefinedError } from 'ajv'
import { ApolloError } from 'apollo-server-core'

import {
  ajv,
  idSchema,
  User,
  user as storeUserSchema,
  UserDTO,
  UserWithId,
  userWithId as updateUserSchema
} from 'schemas'
import { storeUser, updateUser, deleteUser, deleteAllUsers } from './mutations'
import { errorHandling, GE } from '../utils'

const Mutation = {
  storeUser: async (
    parent: unknown,
    { user }: { user: User },
    context: Context
  ): Promise<UserDTO> => {
    const { log } = context
    const validate = ajv.compile(storeUserSchema)

    try {
      const ok = validate(user)

      if (!ok)
        throw new ApolloError(
          \`\${(validate.errors as DefinedError[])[0].instancePath.replace(
            '/',
            ''
          )} \${(validate.errors as DefinedError[])[0].message as string}\`,
          'UNPROCESSABLE_ENTITY'
        )

      return await storeUser({ user }, context)
    } catch (e) {
      log.error(validate.errors)

      return errorHandling({
        e,
        message: GE.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
        log
      })
    }
  },
  updateUser: async (
    parent: unknown,
    { user }: { user: UserWithId },
    context: Context
  ): Promise<UserDTO> => {
    const validate = ajv.compile(updateUserSchema)
    const { log } = context

    try {
      const ok = validate(user)

      if (!ok)
        throw new ApolloError(
          \`\${(validate.errors as DefinedError[])[0].instancePath.replace(
            '/',
            ''
          )} \${(validate.errors as DefinedError[])[0].message as string}\`,
          'UNPROCESSABLE_ENTITY'
        )

      return await updateUser({ user }, context)
    } catch (e) {
      log.error(validate.errors)

      return errorHandling({
        e,
        message: GE.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
        log
      })
    }
  },
  deleteUser: async (
    parent: unknown,
    { id }: { id: string },
    context: Context
  ): Promise<string> => {
    const validate = ajv.compile(idSchema)
    const { log } = context

    try {
      const ok = validate({ id })

      if (!ok)
        throw new ApolloError(
          \`\${(validate.errors as DefinedError[])[0].instancePath.replace(
            '/',
            ''
          )} \${(validate.errors as DefinedError[])[0].message as string}\`,
          'UNPROCESSABLE_ENTITY'
        )

      return await deleteUser({ id }, context)
    } catch (e) {
      log.error(validate.errors)

      return errorHandling({
        e,
        message: GE.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
        log
      })
    }
  },
  deleteAllUsers: async (
    parent: unknown,
    args: unknown,
    context: Context
  ): Promise<string> => {
    const { log } = context
    try {
      return await deleteAllUsers(context)
    } catch (e) {
      return errorHandling({
        e,
        message: GE.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
        log
      })
    }
  }
}

export { Mutation }
`,
          file: `${projectName}/src/graphQL/models/User/mutationsResolver.ts`
        },
        queries: {
          content: `import { ApolloError } from 'apollo-server-core'

import { get } from 'database'
import { UserDTO } from 'schemas'
import { EFU, GE, errorHandling } from '../utils'

const getUsers = async (
  parent: unknown,
  args: unknown,
  { log }: Context
): Promise<UserDTO[]> => {
  try {
    const users = (await get()) as UserDTO[]

    return users
  } catch (e) {
    return errorHandling({
      e,
      message: GE.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      log
    })
  }
}

const getUser = async (
  { id }: { id: string },
  { log }: Context
): Promise<UserDTO> => {
  try {
    const user = (await get(id as string)) as UserDTO | null

    if (!user) throw new ApolloError(EFU.NOT_FOUND, 'NOT_FOUND')

    return user
  } catch (e) {
    return errorHandling({
      e,
      message: GE.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      log
    })
  }
}

export { getUsers, getUser }
`,
          file: `${projectName}/src/graphQL/models/User/queries.ts`
        },
        queriesResolver: {
          content: `import { DefinedError } from 'ajv'
import { ApolloError } from 'apollo-server-core'

import { ajv, idSchema, UserDTO } from 'schemas'
import { getUser, getUsers } from './queries'
import { errorHandling, GE } from '../utils'

const Query = {
  getUser: async (
    parent: unknown,
    { id }: { id: string },
    context: Context
  ): Promise<UserDTO> => {
    const { log } = context
    const validate = ajv.compile(idSchema)

    try {
      const ok = validate({ id })

      if (!ok)
        throw new ApolloError(
          \`id \${(validate.errors as DefinedError[])[0].message as string}\`,
          'UNPROCESSABLE_ENTITY'
        )

      return await getUser({ id }, context)
    } catch (e) {
      log.error(validate.errors)

      return errorHandling({
        e,
        message: GE.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
        log
      })
    }
  },
  getUsers
}

export { Query }
`,
          file: `${projectName}/src/graphQL/models/User/queriesResolver.ts`
        },
        typeDefs: {
          content: `import { gql } from 'apollo-server-core'

const User = gql\`
  type User {
    id: ID!
    name: String!
    lastName: String!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    getUsers: [User!]!
    getUser(id: ID!): User!
  }

  input StoreUserInput {
    lastName: String!
    name: String!
  }

  input UpdateUserInput {
    id: String!
    lastName: String!
    name: String!
  }

  type Mutation {
    storeUser(user: StoreUserInput!): User!
    deleteAllUsers: String
    updateUser(user: UpdateUserInput!): User!
    deleteUser(id: ID!): String
  }
\`

export { User }
`,
          file: `${projectName}/src/graphQL/models/User/typeDefs.ts`
        }
      },
      utils: {
        messages: {
          index: {
            content: `enum GenericErrors {
  INTERNAL_SERVER_ERROR = 'Something went wrong'
}

export { GenericErrors as GE }
export * from './user'
`,
            file: `${projectName}/src/graphQL/models/utils/messages/index.ts`
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
            file: `${projectName}/src/graphQL/models/utils/messages/user.ts`
          }
        },
        index: {
          content: `import { ApolloError } from 'apollo-server-core'
import { HttpLogger } from 'express-pino-logger'

const errorHandling = ({
  e,
  message,
  code,
  log
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  e: any
  message: string
  code: string
  log: HttpLogger['logger']
}): never => {
  log.error(e)

  if (e instanceof ApolloError) throw e

  throw new ApolloError(message ?? e.message, code)
}

export { errorHandling }
export * from './messages'
`,
          file: `${projectName}/src/graphQL/models/utils/index.ts`
        }
      },
      index: {
        content: `import { mergeSchemas } from '@graphql-tools/schema'

import { User } from './User'

const mergedSchema = mergeSchemas({
  schemas: [User]
})

export { mergedSchema }
`,
        file: `${projectName}/src/graphQL/models/index.ts`
      }
    }
  }

  const network = {
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
import { Home } from './routes'
import { docs } from 'utils'

const routers: Router[] = []
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
      content: `import { createServer, Server as HttpServer } from 'http'
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
        this.#log.logger.info(\`Server listening at port: \${PORT}\`)
        this.#log.logger.info(
          \`GraphQL server listening at: http://localhost:\${PORT}\${server.graphqlPath}\`
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
`,
      file: `${projectName}/src/network/server.ts`
    },
    routes: {
      home: {
        content: `import { Response, Request, Router } from 'express'

import { response } from 'network/response'

const Home = Router()

Home.route('').get((req: Request, res: Response) => {
  response({
    error: false,
    message: 'Welcome to your GraphQL Express Backend!',
    res,
    status: 200
  })
})

export { Home }
`,
        file: `${projectName}/src/network/routes/home.ts`
      },
      index: {
        content: "export * from './home'\n",
        file: `${projectName}/src/network/routes/index.ts`
      },
      utils: {
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
      }
    }
  }

  await Promise.all([
    writeFile(graphQL.index.file, graphQL.index.content),
    writeFile(
      graphQL.models.User.index.file,
      graphQL.models.User.index.content
    ),
    writeFile(
      graphQL.models.User.mutations.file,
      graphQL.models.User.mutations.content
    ),
    writeFile(
      graphQL.models.User.mutationsResolver.file,
      graphQL.models.User.mutationsResolver.content
    ),
    writeFile(
      graphQL.models.User.queries.file,
      graphQL.models.User.queries.content
    ),
    writeFile(
      graphQL.models.User.queriesResolver.file,
      graphQL.models.User.queriesResolver.content
    ),
    writeFile(
      graphQL.models.User.typeDefs.file,
      graphQL.models.User.typeDefs.content
    ),
    writeFile(
      graphQL.models.utils.messages.index.file,
      graphQL.models.utils.messages.index.content
    ),
    writeFile(
      graphQL.models.utils.messages.user.file,
      graphQL.models.utils.messages.user.content
    ),
    writeFile(
      graphQL.models.utils.index.file,
      graphQL.models.utils.index.content
    ),
    writeFile(graphQL.models.index.file, graphQL.models.index.content),
    writeFile(network.response.file, network.response.content),
    writeFile(network.router.file, network.router.content),
    writeFile(network.server.file, network.server.content),
    writeFile(network.routes.home.file, network.routes.home.content),
    writeFile(network.routes.index.file, network.routes.index.content),
    writeFile(
      network.routes.utils.index.file,
      network.routes.utils.index.content
    )
  ])
}

/**
 * @param {Object} args
 * @param {String} args.projectName
 */
const fastifyRestNetwork = async ({ projectName }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/network/utils`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  const network = {
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

const PORT = process.env.PORT ?? 1996

class Server {
  #app: FastifyInstance
  #connection: mongoose.Connection | undefined

  constructor() {
    this.#app = fastify({
      logger: { prettyPrint: process.env.NODE_ENV !== 'production' }
    })
    this.#config()
  }

  #config() {
    this.#app.register(require('@fastify/cors'), {})
    this.#app.addHook('preHandler', (req, reply, done) => {
      reply.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
      reply.header('Access-Control-Allow-Origin', '*')
      reply.header(
        'Access-Control-Allow-Headers',
        'Authorization, Content-Type'
      )
      reply.header('x-powered-by', 'Simba.js')
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

  public async stop(): Promise<void> {
    try {
      await this.#app.close()
      process.exit(0)
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
    routes: {
      docs: {
        content: `import { FastifyInstance } from 'fastify'
import fastifySwagger from '@fastify/swagger'

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
  storeUserDto,
  StoreUserDTO
} from 'schemas'
import { UserService } from 'services'

const User = (app: FastifyInstance, prefix = '/api'): void => {
  app
    .post<{ Body: StoreUserDTO }>(
      \`\${prefix}/users\`,
      {
        schema: {
          body: storeUserDto,
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
          user: { lastName, name }
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
    .patch<{ Body: StoreUserDTO; Params: IdSchema }>(
      \`\${prefix}/user/:id\`,
      {
        schema: {
          body: storeUserDto,
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
          userWithId: { name, lastName, id }
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
    utils: {
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

  await Promise.all([
    writeFile(network.response.file, network.response.content),
    writeFile(network.router.file, network.router.content),
    writeFile(network.server.file, network.server.content),
    writeFile(network.routes.docs.file, network.routes.docs.content),
    writeFile(network.routes.home.file, network.routes.home.content),
    writeFile(network.routes.index.file, network.routes.index.content),
    writeFile(network.routes.user.file, network.routes.user.content),
    writeFile(network.utils.index.file, network.utils.index.content)
  ])
}

/**
 * @param {Object} args
 * @param {String} args.projectName
 */
const fastifyGraphQLNetwork = async ({ projectName }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/graphQL/models \
${projectName}/src/graphQL/models/User \
${projectName}/src/graphQL/models/utils \
${projectName}/src/graphQL/models/utils/messages`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  const graphQL = {
    index: {
      content: "export * from './models'\n",
      file: `${projectName}/src/graphQL/index.ts`
    },
    models: {
      User: {
        index: {
          content: `import { makeExecutableSchema } from '@graphql-tools/schema'

import { User as UserTD } from './typeDefs'
import { Query } from './queriesResolver'
import { Mutation } from './mutationsResolver'

const resolvers = {
  Query,
  Mutation
}

const User = makeExecutableSchema({
  typeDefs: UserTD,
  resolvers
})

export { User }
`,
          file: `${projectName}/src/graphQL/models/User/index.ts`
        },
        mutations: {
          content: `import { ApolloError } from 'apollo-server-core'

import { store, remove, update } from 'database'
import { User, UserDTO, UserWithId } from 'schemas'
import { EFU, MFU, GE, errorHandling } from '../utils'

const storeUser = async (
  { user }: { user: User },
  { log }: Context
): Promise<UserDTO> => {
  try {
    const result = await store(user)

    return result
  } catch (e) {
    return errorHandling({
      e,
      message: GE.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      log
    })
  }
}

const deleteAllUsers = async ({ log }: Context): Promise<string> => {
  try {
    const usersDeleted = (await remove()) as number

    if (usersDeleted >= 1) return MFU.ALL_USERS_DELETED

    if (usersDeleted === 0)
      throw new ApolloError(EFU.NOTHING_TO_DELETE, 'NOTHING_TO_DELETE')

    throw new ApolloError(GE.INTERNAL_SERVER_ERROR, 'INTERNAL_SERVER_ERROR')
  } catch (e) {
    return errorHandling({
      e,
      message: GE.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      log
    })
  }
}

const updateUser = async (
  { user }: { user: UserWithId },
  { log }: Context
): Promise<UserDTO> => {
  try {
    const updatedUser = await update(user)

    if (!updatedUser) throw new ApolloError(EFU.NOT_FOUND, 'NOT_FOUND')

    return updatedUser
  } catch (e) {
    return errorHandling({
      e,
      message: GE.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      log
    })
  }
}

const deleteUser = async (
  { id }: { id: string },
  { log }: Context
): Promise<string> => {
  try {
    const deletedUser = await remove(id)

    if (!deletedUser) throw new ApolloError(EFU.NOT_FOUND, 'NOT_FOUND')

    return MFU.USER_DELETED
  } catch (e) {
    return errorHandling({
      e,
      message: GE.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      log
    })
  }
}

export { storeUser, deleteAllUsers, updateUser, deleteUser }
`,
          file: `${projectName}/src/graphQL/models/User/mutations.ts`
        },
        mutationsResolver: {
          content: `import { DefinedError } from 'ajv'
import { ApolloError } from 'apollo-server-core'

import {
  ajv,
  idSchema,
  User,
  user as storeUserSchema,
  UserDTO,
  UserWithId,
  userWithId as updateUserSchema
} from 'schemas'
import { storeUser, updateUser, deleteUser, deleteAllUsers } from './mutations'
import { errorHandling, GE } from '../utils'

const Mutation = {
  storeUser: async (
    parent: unknown,
    { user }: { user: User },
    context: Context
  ): Promise<UserDTO> => {
    const { log } = context
    const validate = ajv.compile(storeUserSchema)

    try {
      const ok = validate(user)

      if (!ok)
        throw new ApolloError(
          \`\${(validate.errors as DefinedError[])[0].instancePath.replace(
            '/',
            ''
          )} \${(validate.errors as DefinedError[])[0].message as string}\`,
          'UNPROCESSABLE_ENTITY'
        )

      return await storeUser({ user }, context)
    } catch (e) {
      log.error(validate.errors)

      return errorHandling({
        e,
        message: GE.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
        log
      })
    }
  },
  updateUser: async (
    parent: unknown,
    { user }: { user: UserWithId },
    context: Context
  ): Promise<UserDTO> => {
    const validate = ajv.compile(updateUserSchema)
    const { log } = context

    try {
      const ok = validate(user)

      if (!ok)
        throw new ApolloError(
          \`\${(validate.errors as DefinedError[])[0].instancePath.replace(
            '/',
            ''
          )} \${(validate.errors as DefinedError[])[0].message as string}\`,
          'UNPROCESSABLE_ENTITY'
        )

      return await updateUser({ user }, context)
    } catch (e) {
      log.error(validate.errors)

      return errorHandling({
        e,
        message: GE.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
        log
      })
    }
  },
  deleteUser: async (
    parent: unknown,
    { id }: { id: string },
    context: Context
  ): Promise<string> => {
    const validate = ajv.compile(idSchema)
    const { log } = context

    try {
      const ok = validate({ id })

      if (!ok)
        throw new ApolloError(
          \`\${(validate.errors as DefinedError[])[0].instancePath.replace(
            '/',
            ''
          )} \${(validate.errors as DefinedError[])[0].message as string}\`,
          'UNPROCESSABLE_ENTITY'
        )

      return await deleteUser({ id }, context)
    } catch (e) {
      log.error(validate.errors)

      return errorHandling({
        e,
        message: GE.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
        log
      })
    }
  },
  deleteAllUsers: async (
    parent: unknown,
    args: unknown,
    context: Context
  ): Promise<string> => {
    const { log } = context
    try {
      return await deleteAllUsers(context)
    } catch (e) {
      return errorHandling({
        e,
        message: GE.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
        log
      })
    }
  }
}

export { Mutation }
`,
          file: `${projectName}/src/graphQL/models/User/mutationsResolver.ts`
        },
        queries: {
          content: `import { ApolloError } from 'apollo-server-core'

import { get } from 'database'
import { UserDTO } from 'schemas'
import { EFU, GE, errorHandling } from '../utils'

const getUsers = async (
  parent: unknown,
  args: unknown,
  { log }: Context
): Promise<UserDTO[]> => {
  try {
    const users = (await get()) as UserDTO[]

    return users
  } catch (e) {
    return errorHandling({
      e,
      message: GE.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      log
    })
  }
}

const getUser = async (
  { id }: { id: string },
  { log }: Context
): Promise<UserDTO> => {
  try {
    const user = (await get(id as string)) as UserDTO | null

    if (!user) throw new ApolloError(EFU.NOT_FOUND, 'NOT_FOUND')

    return user
  } catch (e) {
    return errorHandling({
      e,
      message: GE.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      log
    })
  }
}

export { getUsers, getUser }
`,
          file: `${projectName}/src/graphQL/models/User/queries.ts`
        },
        queriesResolver: {
          content: `import { DefinedError } from 'ajv'
import { ApolloError } from 'apollo-server-core'

import { ajv, idSchema, UserDTO } from 'schemas'
import { getUser, getUsers } from './queries'
import { errorHandling, GE } from '../utils'

const Query = {
  getUser: async (
    parent: unknown,
    { id }: { id: string },
    context: Context
  ): Promise<UserDTO> => {
    const { log } = context
    const validate = ajv.compile(idSchema)

    try {
      const ok = validate({ id })

      if (!ok)
        throw new ApolloError(
          \`id \${(validate.errors as DefinedError[])[0].message as string}\`,
          'UNPROCESSABLE_ENTITY'
        )

      return await getUser({ id }, context)
    } catch (e) {
      log.error(validate.errors)

      return errorHandling({
        e,
        message: GE.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
        log
      })
    }
  },
  getUsers
}

export { Query }
`,
          file: `${projectName}/src/graphQL/models/User/queriesResolver.ts`
        },
        typeDefs: {
          content: `import { gql } from 'apollo-server-core'

const User = gql\`
  type User {
    id: ID!
    name: String!
    lastName: String!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    getUsers: [User!]!
    getUser(id: ID!): User!
  }

  input StoreUserInput {
    lastName: String!
    name: String!
  }

  input UpdateUserInput {
    id: String!
    lastName: String!
    name: String!
  }

  type Mutation {
    storeUser(user: StoreUserInput!): User!
    deleteAllUsers: String
    updateUser(user: UpdateUserInput!): User!
    deleteUser(id: ID!): String
  }
\`

export { User }
`,
          file: `${projectName}/src/graphQL/models/User/typeDefs.ts`
        }
      },
      utils: {
        messages: {
          index: {
            content: `enum GenericErrors {
  INTERNAL_SERVER_ERROR = 'Something went wrong'
}

export { GenericErrors as GE }
export * from './user'
`,
            file: `${projectName}/src/graphQL/models/utils/messages/index.ts`
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
            file: `${projectName}/src/graphQL/models/utils/messages/user.ts`
          }
        },
        index: {
          content: `import { ApolloError } from 'apollo-server-core'
import { FastifyLoggerInstance } from 'fastify'

const errorHandling = ({
  e,
  message,
  code,
  log
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  e: any
  message: string
  code: string
  log: FastifyLoggerInstance
}): never => {
  log.error(e)

  if (e instanceof ApolloError) throw e

  throw new ApolloError(message ?? e.message, code)
}

export { errorHandling }
export * from './messages'
`,
          file: `${projectName}/src/graphQL/models/utils/index.ts`
        }
      },
      index: {
        content: `import { mergeSchemas } from '@graphql-tools/schema'

import { User } from './User'

const mergedSchema = mergeSchemas({
  schemas: [User]
})

export { mergedSchema }
`,
        file: `${projectName}/src/graphQL/models/index.ts`
      }
    }
  }
  const network = {
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
import { Home, Docs } from './routes'

const routers = [Docs]
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
import { ApolloServer } from 'apollo-server-fastify'
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageDisabled
} from 'apollo-server-core'
import { ApolloServerPlugin } from 'apollo-server-plugin-base'
import mongoose from 'mongoose'

import { mergedSchema as schema } from 'graphQL'
import { applyRoutes } from './router'

const PORT = process.env.PORT ?? 1996

class Server {
  #app: FastifyInstance
  #connection: mongoose.Connection | undefined

  constructor() {
    this.#app = fastify({
      logger: { prettyPrint: process.env.NODE_ENV !== 'production' }
    })
    this.#config()
  }

  #config() {
    this.#app.addHook('preHandler', (req, reply, done) => {
      reply.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
      reply.header('Access-Control-Allow-Origin', '*')
      reply.header(
        'Access-Control-Allow-Headers',
        'Authorization, Content-Type'
      )
      reply.header('x-powered-by', 'Simba.js')
      done()
    })
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

  #fastifyAppClosePlugin(): ApolloServerPlugin {
    const app = this.#app

    return {
      async serverWillStart() {
        return {
          async drainServer() {
            await app.close()
          }
        }
      }
    }
  }

  public async start(): Promise<void> {
    const server = new ApolloServer({
      schema,
      plugins: [
        this.#fastifyAppClosePlugin(),
        ApolloServerPluginDrainHttpServer({ httpServer: this.#app.server }),
        process.env.NODE_ENV === 'production'
          ? ApolloServerPluginLandingPageDisabled()
          : ApolloServerPluginLandingPageGraphQLPlayground()
      ],
      context: (): Context => ({
        log: this.#app.log
      })
    })

    try {
      await server.start()
      this.#app.register(
        server.createHandler({
          path: '/api'
        })
      )
      await this.#mongo()
      await this.#app.listen(PORT)
      this.#app.log.info(
        \`GraphQL server listening at: http://localhost:\${PORT}\${server.graphqlPath}\`
      )
    } catch (e) {
      console.error(e)
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.#app.close()
      process.exit(0)
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
    routes: {
      docs: {
        content: `import { FastifyInstance } from 'fastify'
import fastifySwagger from '@fastify/swagger'

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
      message: 'Welcome to your Fastify GraphQL Backend!',
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
export * from './docs'
`,
        file: `${projectName}/src/network/routes/index.ts`
      }
    }
  }

  await Promise.all([
    writeFile(graphQL.index.file, graphQL.index.content),
    writeFile(
      graphQL.models.User.index.file,
      graphQL.models.User.index.content
    ),
    writeFile(
      graphQL.models.User.mutations.file,
      graphQL.models.User.mutations.content
    ),
    writeFile(
      graphQL.models.User.mutationsResolver.file,
      graphQL.models.User.mutationsResolver.content
    ),
    writeFile(
      graphQL.models.User.queries.file,
      graphQL.models.User.queries.content
    ),
    writeFile(
      graphQL.models.User.queriesResolver.file,
      graphQL.models.User.queriesResolver.content
    ),
    writeFile(
      graphQL.models.User.typeDefs.file,
      graphQL.models.User.typeDefs.content
    ),
    writeFile(
      graphQL.models.utils.messages.index.file,
      graphQL.models.utils.messages.index.content
    ),
    writeFile(
      graphQL.models.utils.messages.user.file,
      graphQL.models.utils.messages.user.content
    ),
    writeFile(
      graphQL.models.utils.index.file,
      graphQL.models.utils.index.content
    ),
    writeFile(graphQL.models.index.file, graphQL.models.index.content),
    writeFile(network.response.file, network.response.content),
    writeFile(network.router.file, network.router.content),
    writeFile(network.server.file, network.server.content),
    writeFile(network.routes.docs.file, network.routes.docs.content),
    writeFile(network.routes.home.file, network.routes.home.content),
    writeFile(network.routes.index.file, network.routes.index.content)
  ])
}

/**
 * @param {Object} args
 * @param {Boolean} args.fastify
 * @param {String} args.projectName
 * @param {Boolean} args.graphql
 */
module.exports = async ({ fastify, projectName, graphql }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/network \
${projectName}/src/network/routes ${
    graphql ? `${projectName}/src/graphQL` : ''
  }`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  const network = {
    index: {
      content: `export * from './routes'
export * from './server'
`,
      file: `${projectName}/src/network/index.ts`
    }
  }

  await writeFile(network.index.file, network.index.content)

  if (fastify && graphql) return await fastifyGraphQLNetwork({ projectName })

  if (fastify) return await fastifyRestNetwork({ projectName })

  if (graphql) return await expressGraphQLNetwork({ projectName })

  return await expressRestNetwork({ projectName })
}
