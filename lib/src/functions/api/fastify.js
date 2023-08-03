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
${projectName}/src/network/routes ${
    graphQL
      ? `${projectName}/src/network/models ${projectName}/src/network/resolvers`
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

const routers = [Home${graphQL ? '' : ', User'}]
const applyRoutes = async (app: FastifyInstance) => {
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
import debug from 'debug'
import {
  serializerCompiler,
  validatorCompiler
} from 'fastify-type-provider-zod'
import { ApolloServer } from '@apollo/server'
import fastifyApollo, {
  fastifyApolloDrainPlugin
} from '@as-integrations/fastify'

import { dbConnection } from 'database'
import { applyRoutes } from './router'
import { buildSchemas } from './resolvers'
import { Log } from 'utils'

const d = debug('App:Network:Server')
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 1996

class Server implements Log {
  #app: FastifyInstance
  #connection: Awaited<ReturnType<typeof dbConnection>>
  #apolloServer: ApolloServer | undefined

  constructor() {
    this.#app = fastify()
    this.#connection = dbConnection(d)
  }

  async #config() {
    await this.#apolloConfig()
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

  async #apolloConfig() {
    this.#apolloServer = new ApolloServer({
      schema: await buildSchemas(),
      plugins: [fastifyApolloDrainPlugin(this.#app)]
    })
    await this.#apolloServer.start()
    await this.#app.register(fastifyApollo(this.#apolloServer))
  }

  async start() {
    try {
      await this.#config()
      await this.#connection.connect()
      await this.#app.listen({
        port: PORT,
        host: '::'
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

  async stop() {
    try {
      await this.#connection?.disconnect()
      await this.#app.close()
      await this.#apolloServer?.stop()
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
      \`Server invoked -> \${this.constructor.name} ~ \${method} ~ value: \${value} ~ content: \${content}\`
    )
  }
}

const server = new Server()

export { server as Server }\n`
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
        host: '::'
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
      \`Server invoked -> \${this.constructor.name} ~ \${method} ~ value: \${value} ~ content: \${content}\`
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
      models: {
        index: {
          content: "export * from './User'\n",
          file: `${projectName}/src/network/models/index.ts`
        },
        User: {
          content: `import 'reflect-metadata'
import { Field, ${dbIsSQL ? 'Int' : 'ID'}, ObjectType } from 'type-graphql'

@ObjectType()
class User {
  @Field(() => ${dbIsSQL ? 'Int' : 'ID'})
  id!: number

  @Field()
  lastName!: string

  @Field()
  name!: string

  @Field({ nullable: true })
  createdAt?: string

  @Field({ nullable: true })
  updatedAt?: string
}

export { User }\n`,
          file: `${projectName}/src/network/models/User.ts`
        }
      },
      resolvers: {
        index: {
          content: `import { buildSchema } from 'type-graphql'
import { UserResolver } from './User'

const buildSchemas = async () => {
  const schema = await buildSchema({
    resolvers: [UserResolver],
    validate: { forbidUnknownValues: false }
  })

  return schema
}

export { buildSchemas }\n`,
          file: `${projectName}/src/network/resolvers/index.ts`
        },
        User: {
          content: `import 'reflect-metadata'
import { Arg, Field, InputType, Mutation, Query, Resolver } from 'type-graphql'

import { User } from 'network/models'
import { UserService } from 'services'

@InputType()
class UserInput {
  @Field()
  name!: string

  @Field()
  lastName!: string
}

@Resolver(User)
class UserResolver {
  readonly #userService = new UserService()

  @Query(() => User)
  async getById(@Arg('id') id: ${dbIsSQL ? 'number' : 'string'}) {
    return this.#userService.getById(id)
  }

  @Mutation(() => User)
  async store(@Arg('user') user: UserInput) {
    return this.#userService.store(user)
  }

  @Mutation(() => User)
  async update(@Arg('id') id: ${
    dbIsSQL ? 'number' : 'string'
  }, @Arg('user') user: UserInput) {
    return this.#userService.update(id, user)
  }

  @Mutation(() => String)
  async deleteById(@Arg('id') id: ${dbIsSQL ? 'number' : 'string'}) {
    return this.#userService.deleteById(id)
  }
}

export { UserResolver }\n`,
          file: `${projectName}/src/network/resolvers/User.ts`
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
      writeFile(network.models.index.file, network.models.index.content),
      writeFile(network.models.User.file, network.models.User.content),
      writeFile(network.resolvers.index.file, network.resolvers.index.content),
      writeFile(network.resolvers.User.file, network.resolvers.User.content)
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
  await services({ projectName, dbIsSQL })
  await db({ projectName, database, fastify: true })
}

module.exports = main
