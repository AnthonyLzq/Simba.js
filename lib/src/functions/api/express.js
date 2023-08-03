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
      ? ` ${projectName}/src/network/models ${projectName}/src/network/resolvers`
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
        ? `import { Server as HttpServer } from 'http'
import express from 'express'
import cors from 'cors'
import debug from 'debug'
import { ApolloServer } from '@apollo/server'
// eslint-disable-next-line import/extensions
import { expressMiddleware } from '@apollo/server/express4'

import { dbConnection } from 'database'
import { applyRoutes } from './router'
import { buildSchemas } from './resolvers'
import { Log } from 'utils'

const d = debug('App:Network:Server')
const PORT = (process.env.PORT as string) || 1996

class Server implements Log {
  #app: express.Application
  #server: HttpServer | undefined
  #connection: Awaited<ReturnType<typeof dbConnection>>
  #apolloServer: ApolloServer | undefined

  constructor() {
    this.#app = express()
    this.#connection = dbConnection(d)
  }

  async #config() {
    await this.#apolloConfig()
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

  async #apolloConfig() {
    this.#apolloServer = new ApolloServer({
      schema: await buildSchemas()
    })
    await this.#apolloServer.start()
    this.#app.use(
      '/graphql',
      cors(),
      express.json(),
      expressMiddleware(this.#apolloServer)
    )
  }

  async start() {
    try {
      await this.#config()
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

  async stop() {
    try {
      await this.#connection?.disconnect()
      this.#server?.close()
      await this.#apolloServer?.stop()
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
      } ~ \${method} ~ value: \${value} ~ content: \${content}\`
    )
  }
}

const server = new Server()

export { server as Server }\n`
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
    this.#connection = dbConnection(d)
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
      this.#config()
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
        const user = await us.getById(${dbIsSQL ? 'parseInt(id)' : 'id'})

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
        const user = await us.update(${
          dbIsSQL ? 'parseInt(id)' : 'id'
        }, { name, lastName })

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
        const result = await us.deleteById(${dbIsSQL ? 'parseInt(id)' : 'id'})

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
import { ZodType } from 'zod'

type Middleware = (req: Request, res: Response, next: NextFunction) => void

const validatorCompiler = (
  schema: ZodType,
  value: 'body' | 'params'
): Middleware => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[value])

    if (result.success) return next()

    return next(
      new httpErrors.UnprocessableEntity(JSON.stringify(result.error))
    )
  }
}

export { validatorCompiler }\n`,
          file: `${projectName}/src/network/routes/utils/index.ts`
        }
      }
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
    writeFile(network.routes.home.file, network.routes.home.content),
    writeFile(network.routes.index.file, network.routes.index.content),
    writeFile(
      network.routes.utils.index.file,
      network.routes.utils.index.content
    )
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
  await services({ projectName, dbIsSQL })
  await db({ projectName, database })
}

module.exports = main
