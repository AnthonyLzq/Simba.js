const { platform } = require('os')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)

const db = require('./database')
const schemas = require('./schemas')
const services = require('./services')
const utils = require('./utils')
const writeFile = require('../../utils/writeFile')

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {Boolean} args.graphQL
 * @param {Boolean} args.dbIsSQL
 */
const types = async ({ projectName, graphQL, dbIsSQL }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/@types ${
    !dbIsSQL ? ` ${projectName}/src/@types/models` : ''
  } ${graphQL ? `  ${projectName}/src/@types/graphQL` : ''}`

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
    ...(!dbIsSQL && {
      models: {
        user: {
          content: `interface UserDBO {
  name: string
  lastName: string
  createdAt: Date
  updatedAt: Date
}
`,
          file: `${projectName}/src/@types/models/user.d.ts`
        }
      }
    }),
    ...(graphQL && {
      graphQL: {
        context: {
          content: `type Context = {
  log: import('fastify').FastifyInstance['log']
}
`,
          file: `${projectName}/src/@types/graphQL/context.d.ts`
        }
      }
    })
  }
  const processes = [writeFile(types.index.file, types.index.content)]

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
${projectName}/src/network/routes ${projectName}/src/network/utils ${
    graphQL
      ? `${projectName}/src/graphQL ${projectName}/src/graphQL/models \
${projectName}/src/graphQL/models/User ${projectName}/src/graphQL/models/utils \
${projectName}/src/graphQL/models/utils/messages`
      : ''
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
    },
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
${
  graphQL
    ? "import { Home, Docs } from './routes'"
    : "import { Home, User, Docs } from './routes'"
}

${graphQL ? '' : 'const routers = [User]'}
const applyRoutes = async (app: FastifyInstance) => {
  Home(app)
  routers.forEach(router => router(app))
  await Docs(app)

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

export { applyRoutes }\n`,
      file: `${projectName}/src/network/router.ts`
    },
    server: {
      content: graphQL
        ? `import fastify, { FastifyInstance } from 'fastify'
import { ApolloServer } from 'apollo-server-fastify'
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageDisabled
} from 'apollo-server-core'
import { ApolloServerPlugin } from 'apollo-server-plugin-base'
import { dbConnection } from 'database'

import { mergedSchema as schema } from 'graphQL'
import { applyRoutes } from './router'

const PORT = process.env.PORT ?? 1996
const ENVIRONMENTS_WITHOUT_PRETTY_PRINT = ['production', 'ci']

class Server {
  #app: FastifyInstance
  #connection: Awaited<ReturnType<typeof dbConnection>> | undefined

  constructor() {
    this.#app = fastify({
      logger: {
        prettyPrint: !ENVIRONMENTS_WITHOUT_PRETTY_PRINT.includes(
          process.env.NODE_ENV as string
        )
      }
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

  async #dbConnection() {
    this.#connection = await dbConnection(this.#app.log)
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
      await this.#dbConnection()
      await this.#connection?.connect()
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
      await this.#connection?.disconnect()
      await this.#app.close()
    } catch (e) {
      console.error(e)
    }
  }
}

const server = new Server()

export { server as Server }
`
        : `import fastify, { FastifyInstance } from 'fastify'
import debug from 'debug'
import {
  serializerCompiler,
  validatorCompiler
} from 'fastify-type-provider-zod'

import { dbConnection } from 'database'
import { Log } from 'utils'
import { applyRoutes } from './router'

const d = debug('App:Network:Server')
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 1996

class Server implements Log {
  #app: FastifyInstance
  #connection: Awaited<ReturnType<typeof dbConnection>>

  constructor() {
    this.#app = fastify()
    this.#connection = dbConnection(d)
  }

  async #config() {
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
    this.#app.setSerializerCompiler(serializerCompiler)
    await applyRoutes(this.#app)
  }

  async start(): Promise<void> {
    try {
      await this.#config()
      await this.#connection.connect()
      await this.#app.listen({
        port: PORT,
        host: '0.0.0.0'
      })
      d(\`HTTP server listening on port \${PORT}.\`)
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
      await this.#app.close()
      d('HTTP server stopped.')
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
      docs: {
        content: `import { FastifyInstance } from 'fastify'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { jsonSchemaTransform } from 'fastify-type-provider-zod'

const Docs = async (app: FastifyInstance, prefix = '/api') => {
  await app.register(fastifySwagger, {
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
    transform: jsonSchemaTransform
  })
  await app.register(fastifySwaggerUi, { routePrefix: \`\${prefix}/docs\` })
}

export { Docs }\n`,
        file: `${projectName}/src/network/routes/docs.ts`
      },
      home: {
        content: `import { FastifyInstance } from 'fastify'
import { response } from 'network/response'

const Home = (app: FastifyInstance, prefix = '/') => {
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
export * from './docs'
${graphQL ? '' : "export * from './user'\n"}`,

        file: `${projectName}/src/network/routes/index.ts`
      },
      ...(!graphQL && {
        user: {
          content: `import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

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
    .withTypeProvider<ZodTypeProvider>()
    .post<{ Body: StoreUserDTO }>(
      \`\${prefix}/users\`,
      {
        schema: {
          body: storeUserDto,
          response: {
            201: z.object({
              error: z.boolean(),
              message: userDto
            })
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
        const us = new UserService()
        const user = await us.store({ lastName, name })

        response({ error: false, message: user, reply, status: 201 })
      }
    )
    .get<{ Params: IdSchema }>(
      \`\${prefix}/user/:id\`,
      {
        schema: {
          params: idSchema,
          response: {
            200: z.object({
              error: z.boolean(),
              message: userDto
            })
          },
          tags: ['user']
        }
      },
      async (request, reply) => {
        const {
          params: { id }
        } = request
        const us = new UserService()
        const user = await us.getById(id)

        response({ error: false, message: user, reply, status: 200 })
      }
    )
    .patch<{ Body: StoreUserDTO; Params: IdSchema }>(
      \`\${prefix}/user/:id\`,
      {
        schema: {
          body: storeUserDto,
          params: idSchema,
          response: {
            200: z.object({
              error: z.boolean(),
              message: userDto
            })
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
        const us = new UserService()
        const user = await us.update(id, { name, lastName })

        response({ error: false, message: user, reply, status: 200 })
      }
    )
    .delete<{ Params: IdSchema }>(
      \`\${prefix}/user/:id\`,
      {
        schema: {
          params: idSchema,
          response: {
            200: z.object({
              error: z.boolean(),
              message: z.string()
            })
          },
          tags: ['user']
        }
      },
      async (request, reply) => {
        const {
          params: { id }
        } = request
        const us = new UserService()
        const result = await us.deleteById(id)

        response({ error: false, message: result, reply, status: 200 })
      }
    )
}

export { User }\n`,
          file: `${projectName}/src/network/routes/user.ts`
        }
      })
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
    })
  }
  const processes = [
    writeFile(network.index.file, network.index.content),
    writeFile(network.response.file, network.response.content),
    writeFile(network.router.file, network.router.content),
    writeFile(network.server.file, network.server.content),
    writeFile(network.routes.docs.file, network.routes.docs.content),
    writeFile(network.routes.home.file, network.routes.home.content),
    writeFile(network.routes.index.file, network.routes.index.content)
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

  await utils({ fastify: true, projectName, email, projectVersion })
  await types({ projectName, graphQL, dbIsSQL })
  await network({ projectName, graphQL, dbIsSQL })
  await schemas({ projectName, graphQL, dbIsSQL })

  if (!graphQL) await services({ projectName, dbIsSQL })

  await db({ projectName, database, fastify: true })
}

module.exports = main
