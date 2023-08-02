const { platform } = require('os')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)

const db = require('./database')
const schemas = require('./schemas')
const services = require('./services')
const writeFile = require('../../utils/writeFile')
const utils = require('./utils')

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {Boolean} args.graphQL
 * @param {Boolean} args.dbIsSQL
 */
const types = async ({ projectName, graphQL, dbIsSQL }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/@types ${projectName}/src/@types/custom \
${!dbIsSQL ? ` ${projectName}/src/@types/models` : ''} ${
    graphQL ? ` ${projectName}/src/@types/graphQL` : ''
  }`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  const types = {
    index: {
      content: `/* eslint-disable no-var */
declare global {}

export {}
`,
      file: `${projectName}/src/@types/index.d.ts`
    },
    custom: {
      params: {
        content: `type Params = {
  [key: string]: string
}\n`,
        file: `${projectName}/src/@types/custom/params.d.ts`
      }
    },
    ...(graphQL && {
      graphQL: {
        context: {
          content: `type Context = {
  log: import('express-pino-logger').HttpLogger['logger']
}
`,
          file: `${projectName}/src/@types/graphQL/context.d.ts`
        }
      }
    })
  }
  const processes = [
    writeFile(types.index.file, types.index.content),
    writeFile(types.custom.params.file, types.custom.params.content)
  ]

  if (!dbIsSQL)
    processes.push(writeFile(types.models.user.file, types.models.user.content))

  if (graphQL)
    processes.push(
      writeFile(types.graphQL.context.file, types.graphQL.context.content)
    )

  await Promise.all(processes)
}

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {String} args.graphQL
 * @param {String} args.dbIsSQL
 */
const network = async ({ projectName, graphQL, dbIsSQL }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/network \
${projectName}/src/network/routes ${projectName}/src/network/routes/utils ${
    graphQL
      ? ` ${projectName}/src/graphQL ${projectName}/src/graphQL/models \
${projectName}/src/graphQL/models/User ${projectName}/src/graphQL/models/utils \
${projectName}/src/graphQL/models/utils/messages`
      : ''
  }`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  const network = {
    index: {
      content: `export * from './routes'\nexport * from './server'\n`,
      file: `${projectName}/src/network/index.ts`
    },
    response: {
      content: `import { type Response } from 'express'

const response = ({
  error,
  message,
  res,
  status
}: {
  error: boolean
  message: unknown
  res: Response
  status: number
}) => {
  res.status(status).send({ error, message })
}

export { response }\n`,
      file: `${projectName}/src/network/response.ts`
    },
    router: {
      content: `import { Application, Response, Request, Router, NextFunction } from 'express'
import swaggerUi from 'swagger-ui-express'
import httpErrors from 'http-errors'

import { response } from './response'
${
  graphQL
    ? "import { Home } from './routes'"
    : "import { Home, User } from './routes'"
}
import { docs } from 'utils'

${graphQL ? 'const routers: Router[] = []' : 'const routers = [User]'}
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
      content: graphQL
        ? `import { createServer, Server as HttpServer } from 'http'
import express from 'express'
import cors from 'cors'
import pino, { HttpLogger } from 'express-pino-logger'
import { ApolloServer } from 'apollo-server-express'
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginLandingPageGraphQLPlayground
} from 'apollo-server-core'

import { dbConnection } from 'database'
import { mergedSchema as schema } from 'graphQL'
import { applyRoutes } from './router'

const PORT = (process.env.PORT as string) || 1996
const ENVIRONMENTS_WITHOUT_PRETTY_PRINT = ['production', 'ci']

class Server {
  #app: express.Application
  #log: HttpLogger
  #server: HttpServer
  #connection: Awaited<ReturnType<typeof dbConnection>> | undefined

  constructor() {
    this.#app = express()
    this.#server = createServer(this.#app)
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
  }

  async #dbConnection() {
    this.#connection = await dbConnection(this.#log.logger)
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
      await this.#dbConnection()
      await this.#connection?.connect()
      this.#server.listen(PORT, () => {
        this.#log.logger.info(\`Server listening at port: \${PORT}\`)
        this.#log.logger.info(
          \`GraphQL server listening at: http://localhost:\${PORT}\${server.graphqlPath}\`
        )
      })
    } catch (e) {
      console.error(e)
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
`
        : `import { Server as HttpServer } from 'http'
import express from 'express'
import cors from 'cors'
import debug from 'debug'

import { dbConnection } from 'database'
import { applyRoutes } from './router'
import { Log } from 'utils'

const d = debug('App:Network:Server')
const PORT = (process.env.PORT as string) || 1996

class Server implements Log {
  #app: express.Application
  #server: HttpServer | undefined
  #connection: Awaited<ReturnType<typeof dbConnection>>

  constructor() {
    this.#app = express()
    this.#connection = dbConnection()
    this.#config()
  }

  #config() {
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

  async start(): Promise<void> {
    try {
      await this.#connection.connect()
      await this.#connection?.connect()
      this.#server = this.#app.listen(PORT, () => {
        d(\`HTTP server listening on port \${PORT}.\`)
      })
    } catch (e) {
      this.log({
        method: this.start.name,
        value: 'error',
        content: e
      })
    }
  }

  async stop(): Promise<void> {
    try {
      await this.#connection?.disconnect()
      this.#server?.close()
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
      \`Server invoked -> \${
        this.constructor.name
      } ~ \${method} ~ value: \${value} ~ content: \${JSON.stringify(content)}\`
    )
  }
}

const server = new Server()

export { server as Server }\n`,
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
${graphQL ? '' : "export * from './user'\n"}`,
        file: `${projectName}/src/network/routes/index.ts`
      },
      ...(!graphQL && {
        user: {
          content: `import { type NextFunction, type Request, type Response, Router } from 'express'

import { response } from 'network/response'
import { UserService } from 'services'
import { idSchema, storeUserDto, UserDTO } from 'schemas'
import { validatorCompiler } from './utils'

const User = Router()

User.route('/users').post(
  validatorCompiler(storeUserDto, 'body'),
  async (
    req: Request<Params, Record<string, unknown>, { args: UserDTO }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const {
        body: {
          args: { lastName, name }
        }
      } = req
      const us = new UserService()
      const user = await us.store({ lastName, name })

      response({ error: false, message: user, res, status: 201 })
    } catch (error) {
      next(error)
    }
  }
)

User.route('/user/:id')
  .get(
    validatorCompiler(idSchema, 'params'),
    async (
      req: Request<{ id: string }, Record<string, unknown>>,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const {
          params: { id }
        } = req
        const us = new UserService()
        const user = await us.getById(parseInt(id))

        response({ error: false, message: user, res, status: 200 })
      } catch (error) {
        next(error)
      }
    }
  )
  .patch(
    validatorCompiler(idSchema, 'params'),
    validatorCompiler(storeUserDto, 'body'),
    async (
      req: Request<{ id: string }, Record<string, unknown>, { args: UserDTO }>,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const {
          body: {
            args: { name, lastName }
          },
          params: { id }
        } = req
        const us = new UserService()
        const user = await us.update(parseInt(id), { name, lastName })

        response({ error: false, message: user, res, status: 200 })
      } catch (error) {
        next(error)
      }
    }
  )
  .delete(
    validatorCompiler(idSchema, 'params'),
    async (
      req: Request<{ id: string }>,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const {
          params: { id }
        } = req
        const us = new UserService()
        const result = await us.deleteById(parseInt(id))

        response({ error: false, message: result, res, status: 200 })
      } catch (error) {
        next(error)
      }
    }
  )

export { User }\n`,
          file: `${projectName}/src/network/routes/user.ts`
        }
      }),
      utils: {
        index: {
          content: `import { type NextFunction, type Request, type Response } from 'express'
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
  req: Request,
  res: Response,
  next: NextFunction
) => void

const validatorCompiler = <T extends TProperties>(
  schema: TObject<T>,
  value: 'body' | 'params'
): Middleware => {
  return (req: Request, res: Response, next: NextFunction) => {
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

export { validatorCompiler }\n`,
          file: `${projectName}/src/network/routes/utils/index.ts`
        }
      }
    },
    ...(graphQL && {
      graphQL: {
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
  { id }: { id: ${dbIsSQL ? 'number' : 'string'} },
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
    { id }: { id: ${dbIsSQL ? 'number' : 'string'} },
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
  { id }: { id: ${dbIsSQL ? 'number' : 'string'} },
  { log }: Context
): Promise<UserDTO> => {
  try {
    const user = (await get(id${dbIsSQL ? '' : ' as string'})) as UserDTO | null

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
    { id }: { id: ${dbIsSQL ? 'number' : 'string'} },
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
    id: ${dbIsSQL ? 'Int' : 'ID'}!
    name: String!
    lastName: String!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    getUsers: [User!]!
    getUser(id: ${dbIsSQL ? 'Int' : 'ID'}!): User!
  }

  input StoreUserInput {
    lastName: String!
    name: String!
  }

  input UpdateUserInput {
    id: ${dbIsSQL ? 'Int' : 'String'}!
    lastName: String!
    name: String!
  }

  type Mutation {
    storeUser(user: StoreUserInput!): User!
    deleteAllUsers: String
    updateUser(user: UpdateUserInput!): User!
    deleteUser(id: ${dbIsSQL ? 'Int' : 'ID'}!): String
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
    })
  }
  const processes = [
    writeFile(network.index.file, network.index.content),
    writeFile(network.response.file, network.response.content),
    writeFile(network.router.file, network.router.content),
    writeFile(network.server.file, network.server.content),
    writeFile(network.routes.home.file, network.routes.home.content),
    writeFile(network.routes.index.file, network.routes.index.content),
    writeFile(
      network.routes.utils.index.file,
      network.routes.utils.index.content
    )
  ]

  if (graphQL)
    processes.concat([
      writeFile(network.graphQL?.index.file, network.graphQL?.index.content),
      writeFile(
        network.graphQL?.models.User.index.file,
        network.graphQL?.models.User.index.content
      ),
      writeFile(
        network.graphQL?.models.User.mutations.file,
        network.graphQL?.models.User.mutations.content
      ),
      writeFile(
        network.graphQL?.models.User.mutationsResolver.file,
        network.graphQL?.models.User.mutationsResolver.content
      ),
      writeFile(
        network.graphQL?.models.User.queries.file,
        network.graphQL?.models.User.queries.content
      ),
      writeFile(
        network.graphQL?.models.User.queriesResolver.file,
        network.graphQL?.models.User.queriesResolver.content
      ),
      writeFile(
        network.graphQL?.models.User.typeDefs.file,
        network.graphQL?.models.User.typeDefs.content
      ),
      writeFile(
        network.graphQL?.models.utils.messages.index.file,
        network.graphQL?.models.utils.messages.index.content
      ),
      writeFile(
        network.graphQL?.models.utils.messages.user.file,
        network.graphQL?.models.utils.messages.user.content
      ),
      writeFile(
        network.graphQL?.models.utils.index.file,
        network.graphQL?.models.utils.index.content
      ),
      writeFile(
        network.graphQL?.models.index.file,
        network.graphQL?.models.index.content
      )
    ])
  else
    processes.push(
      writeFile(network.routes.user.file, network.routes.user.content)
    )

  await Promise.all(processes)
}

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {String} args.email
 * @param {String} args.projectVersion
 * @param {Boolean} args.graphQL
 * @param {import('../../../../').Config['database']} args.database
 */
const main = async ({
  projectName,
  email,
  projectVersion,
  graphQL,
  database
}) => {
  const dbIsSQL = database !== 'mongo'

  await utils({
    fastify: false,
    projectName,
    email,
    projectVersion,
    graphQL,
    dbIsSQL
  })
  await types({ projectName, graphQL, dbIsSQL })
  await network({ projectName, graphQL, dbIsSQL })
  await schemas({ projectName, dbIsSQL, graphQL })

  if (!graphQL) await services({ projectName, dbIsSQL })

  await db({ projectName, database })
}

module.exports = main
