const { platform } = require('os')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const writeFile = require('../../utils/writeFile')

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {Boolean} args.graphQL
 * @param {Boolean} args.dbIsSQL
 */
const types = async ({ projectName, graphQL, dbIsSQL }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/@types ${projectName}/src/@types/models \
${!dbIsSQL ? ` ${projectName}/src/@types/models` : ''} ${
    graphQL ? `  ${projectName}/src/@types/graphQL` : ''
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
 */
const mongo = async ({ projectName }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/database \
${projectName}/src/database/mongo ${projectName}/src/database/mongo/models \
${projectName}/src/database/mongo/queries`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  const database = {
    index: {
      content: "export * from './mongo'\n",
      file: `${projectName}/src/database/index.ts`
    },
    mongo: {
      connection: {
        content: `import { connect, connection } from 'mongoose'
import { FastifyLoggerInstance } from 'fastify'

const ENVIRONMENTS_WITHOUT_RECONNECTION = ['ci', 'local']
const dbConnection = async (
  logger: FastifyLoggerInstance
): Promise<{
  connect: () => Promise<typeof import('mongoose')>
  disconnect: () => Promise<void>
}> => {
  const connectionConfig = {
    keepAlive: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
  }

  connection.on('connected', () => {
    logger.info('Mongo connection established.')
  })
  connection.on('reconnected', () => {
    logger.info('Mongo connection reestablished')
  })
  connection.on('disconnected', () => {
    if (
      !ENVIRONMENTS_WITHOUT_RECONNECTION.includes(
        process.env.NODE_ENV as string
      )
    ) {
      logger.info(
        'Mongo connection disconnected. Trying to reconnected to Mongo...'
      )
      setTimeout(() => {
        connect(process.env.MONGO_URI as string, {
          ...connection,
          connectTimeoutMS: 3000,
          socketTimeoutMS: 3000
        })
      }, 3000)
    }
  })
  connection.on('close', () => {
    logger.info('Mongo connection closed')
  })
  connection.on('error', (e: Error) => {
    logger.info('Mongo connection error:')
    logger.error(e)
  })

  return {
    connect: () => connect(process.env.MONGO_URI as string, connectionConfig),
    disconnect: () => connection.close()
  }
}

export { dbConnection }
`,
        file: `${projectName}/src/database/mongo/connection.ts`
      },
      index: {
        content: `export * from './models'
export * from './queries'
export * from './connection'
`,
        file: `${projectName}/src/database/mongo/index.ts`
      },
      models: {
        index: {
          content: "export * from './user'\n",
          file: `${projectName}/src/database/mongo/models/index.ts`
        },
        user: {
          content: `import { model, Schema } from 'mongoose'

const UserSchema = new Schema<UserDBO>(
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
    timestamps: true,
    versionKey: false,
    toObject: {
      transform: (_, ret) => {
        ret.id = ret._id.toString()
        delete ret._id
      }
    }
  }
)

const UserModel = model<UserDBO>('users', UserSchema)

export { UserModel }
`,
          file: `${projectName}/src/database/mongo/models/user.ts`
        }
      },
      queries: {
        index: {
          content: "export * from './user'\n",
          file: `${projectName}/src/database/mongo/queries/index.ts`
        },
        user: {
          content: `import { Document, MergeType, Types } from 'mongoose'

import { UserModel } from '..'
import { User, UserDTO, UserWithId } from 'schemas'

const userDBOtoDTO = (
  userDBO: Document<unknown, unknown, MergeType<UserDBO, UserDBO>> &
    Omit<UserDBO, keyof UserDBO> &
    UserDBO & {
      _id: Types.ObjectId
    }
): UserDTO => ({
  ...userDBO.toObject(),
  createdAt: userDBO.createdAt.toISOString(),
  updatedAt: userDBO.updatedAt.toISOString()
})

const store = async (userData: User): Promise<UserDTO> => {
  const user = new UserModel(userData)

  await user.save()

  return userDBOtoDTO(user)
}

const remove = async (
  id: string | null = null
): Promise<UserDTO | number | null> => {
  if (id) {
    const removedUser = await UserModel.findByIdAndRemove(id)

    if (!removedUser) return null

    return userDBOtoDTO(removedUser)
  }

  return (await UserModel.deleteMany({})).deletedCount
}

const get = async (
  id: string | null = null
): Promise<UserDTO[] | UserDTO | null> => {
  if (id) {
    const user = await UserModel.findById(id)

    return user ? userDBOtoDTO(user) : null
  }

  const users = await UserModel.find({})

  return users.map(u => userDBOtoDTO(u))
}

const update = async (userData: UserWithId): Promise<UserDTO | null> => {
  const { id, ...rest } = userData
  const user = await UserModel.findByIdAndUpdate(id, rest, { new: true })

  return user ? userDBOtoDTO(user) : null
}

export { store, remove, get, update }
`,
          file: `${projectName}/src/database/mongo/queries/user.ts`
        }
      }
    }
  }

  await Promise.all([
    writeFile(database.index.file, database.index.content),
    writeFile(
      database.mongo.connection.file,
      database.mongo.connection.content
    ),
    writeFile(database.mongo.index.file, database.mongo.index.content),
    writeFile(
      database.mongo.models.index.file,
      database.mongo.models.index.content
    ),
    writeFile(
      database.mongo.models.user.file,
      database.mongo.models.user.content
    ),
    writeFile(
      database.mongo.queries.index.file,
      database.mongo.queries.index.content
    ),
    writeFile(
      database.mongo.queries.user.file,
      database.mongo.queries.user.content
    )
  ])
}

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {import('../../../../').Config['database']} args.db
 */
const sql = async ({ projectName, db }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/scripts \
${projectName}/src/database ${projectName}/src/database/${db} \
${projectName}/src/database/${db}/models ${projectName}/src/database/${db}/queries \
${projectName}/src/database/${db}/migrations`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  const database = {
    index: {
      content: `export * from './${db}'\n`,
      file: `${projectName}/src/database/index.ts`
    },
    [db]: {
      config: {
        content: `require('dotenv').config()

module.exports = {
  development: {
    url: process.env.DB_URI,
    dialect: 'postgres'
  },
  production: {
    url: process.env.DB_URI,
    dialect: 'postgres'
  }
}
`,
        file: `${projectName}/src/database/${db}/config.js`
      },
      connection: {
        content: `import { join } from 'path'
import { Sequelize } from 'sequelize-typescript'
import { FastifyLoggerInstance } from 'fastify'

import * as models from './models'

let sequelize: Sequelize

const dbConnection = async (
  logger: FastifyLoggerInstance
): Promise<{
  connect: () => Promise<Sequelize>
  disconnect: () => Promise<void>
  createMigration: (migrationName: string) => Promise<void>
}> => {
  return {
    connect: async () => {
      if (!sequelize) {
        sequelize = new Sequelize(process.env.DB_URI as string, {
          models: Object.values(models)
        })
        logger?.info('Postgres connection established.')
      }

      return sequelize
    },
    disconnect: () => {
      logger?.info('Postgres connection closed.')

      return sequelize?.close()
    },
    createMigration: async (migrationName: string) => {
      const { SequelizeTypescriptMigration } = await import(
        'sequelize-typescript-migration-lts'
      )

      await SequelizeTypescriptMigration.makeMigration(sequelize, {
        outDir: join(__dirname, './migrations'),
        migrationName,
        preview: false
      })
    }
  }
}

export { dbConnection }
`,
        file: `${projectName}/src/database/${db}/connection.ts`
      },
      index: {
        content: `export * from './connection'
export * from './models'
export * from './queries'
`,
        file: `${projectName}/src/database/${db}/index.ts`
      },
      models: {
        index: {
          content: "export * from './user'\n",
          file: `${projectName}/src/database/${db}/models/index.ts`
        },
        user: {
          content: `import { Model, Column, Table, DataType } from 'sequelize-typescript'

@Table({
  paranoid: true,
  tableName: 'users'
})
class User extends Model {
  @Column({
    type: DataType.STRING
  })
  name!: string

  @Column({
    type: DataType.STRING
  })
  lastName!: string

  @Column({
    type: DataType.STRING
  })
  email!: string
}

export { User }
`,
          file: `${projectName}/src/database/${db}/models/user.ts`
        }
      },
      queries: {
        index: {
          content: "export * from './user'\n",
          file: `${projectName}/src/database/${db}/queries/index.ts`
        },
        user: {
          content: `import { User } from '..'
import { User as UserSchema, UserDTO, UserWithId } from 'schemas'
import { Transaction } from 'sequelize/types'

const userDBOtoDTO = (userDBO: User): UserDTO => ({
  ...userDBO.get(),
  createdAt: userDBO.createdAt.toISOString(),
  updatedAt: userDBO.updatedAt.toISOString()
})

const store = async (
  userData: UserSchema,
  transaction: Transaction | null = null
): Promise<UserDTO> => {
  const user = await User.create(userData, {
    transaction
  })

  return userDBOtoDTO(user)
}

const remove = async (
  id: number | null = null,
  transaction: Transaction | null = null
): Promise<number | null> => {
  if (id) {
    const removedUser = await User.destroy({
      where: { id },
      transaction
    })

    return removedUser
  }

  const w = await User.destroy({ truncate: true, transaction })

  return w
}

const get = async (
  id: number | null = null
): Promise<UserDTO[] | UserDTO | null> => {
  if (id) {
    const user = await User.findByPk(id)

    return user ? userDBOtoDTO(user) : null
  }

  const { rows: users } = await User.findAndCountAll()

  return users.map(u => userDBOtoDTO(u))
}

const update = async (userData: UserWithId): Promise<UserDTO | null> => {
  const { id, ...rest } = userData
  const [, user] = await User.update(rest, {
    where: { id },
    returning: true,
    limit: 1
  })

  return user[0] ? userDBOtoDTO(user[0]) : null
}

export { store, remove, get, update }
`,
          file: `${projectName}/src/database/${db}/queries/user.ts`
        }
      }
    },
    scripts: {
      migration: {
        content: `import { dbConnection } from 'database'
import { promisify } from 'util'

const exec = promisify(require('child_process').exec)

const migration = async () => {
  const connection = await dbConnection()

  await connection.connect()

  console.log('Creating migration')

  if (process.env.MIGRATION)
    await connection.createMigration(process.env.MIGRATION)

  console.log('Executing migration')

  await exec(
    'yarn migrations:run:last && eslint src/database/* --ext .js --fix'
  )

  console.log('Migration complete')
}

migration()
`,
        file: `${projectName}/src/scripts/migration.ts`
      }
    },
    sequelizerc: {
      content: `module.exports = {
  config: './src/database/postgres/config.js',
  'migrations-path': './src/database/postgres/migrations/'
}
`,
      file: `${projectName}/.sequelizerc`
    }
  }

  await Promise.all([
    writeFile(database.index.file, database.index.content),
    writeFile(database[db].config.file, database[db].config.content),
    writeFile(database[db].connection.file, database[db].connection.content),
    writeFile(database[db].index.file, database[db].index.content),
    writeFile(
      database[db].models.index.file,
      database[db].models.index.content
    ),
    writeFile(database[db].models.user.file, database[db].models.user.content),
    writeFile(
      database[db].queries.index.file,
      database[db].queries.index.content
    ),
    writeFile(
      database[db].queries.user.file,
      database[db].queries.user.content
    ),
    writeFile(
      database.scripts.migration.file,
      database.scripts.migration.content
    ),
    writeFile(database.sequelizerc.file, database.sequelizerc.content)
  ])
}

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {String} args.graphQL
 */
const network = async ({ projectName, graphQL }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/network \
${projectName}/src/network/routes ${projectName}/src/network/utils ${
    graphQL
      ? ` ${projectName}/src/graphQL/models/User ${projectName}/src/graphQL/models/utils ${projectName}/src/graphQL/models/utils/messages`
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

import { dbConnection } from 'database'
import { applyRoutes } from './router'
import { validatorCompiler } from './utils'

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

  async #dbConnection() {
    this.#connection = await dbConnection(this.#app.log)
  }

  public async start(): Promise<void> {
    try {
      await this.#dbConnection()
      await this.#connection?.connect()
      await this.#app.listen(PORT)
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
    })
  }
  const processes = [
    writeFile(network.index.file, network.index.content),
    writeFile(network.response.file, network.response.content),
    writeFile(network.router.file, network.router.content),
    writeFile(network.server.file, network.server.content),
    writeFile(network.routes.docs.file, network.routes.docs.content),
    writeFile(network.routes.home.file, network.routes.home.content),
    writeFile(network.routes.index.file, network.routes.index.content),
    writeFile(network.routes.user.file, network.routes.user.content),
    writeFile(network.utils.index.file, network.utils.index.content)
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

  await Promise.all(processes)
}

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {Boolean} args.dbIsSQL
 * @param {Boolean} args.graphQL
 */
const schemas = async ({ projectName, dbIsSQL, graphQL }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/schemas`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  const schemas = {
    index: {
      content: graphQL
        ? `import { Static, Type } from '@sinclair/typebox'
import Ajv from 'ajv/dist/2019.js'
import addFormats from 'ajv-formats'

const id = ${
            dbIsSQL
              ? `Type.Number()`
              : `Type.String({ pattern: '^[a-zA-Z0-9]{24,}$' })`
          }
type ID = Static<typeof id>

const idSchema = Type.Object({ id })

type IDSchema = Static<typeof idSchema>

const ajv = addFormats(new Ajv(), ['email'])
  .addKeyword('kind')
  .addKeyword('modifier')

export { id, ID, idSchema, IDSchema, ajv }
export * from './user'
`
        : `import { Static, Type } from '@sinclair/typebox'

const id = ${
            dbIsSQL
              ? `Type.Number()`
              : `Type.String({ pattern: '^[a-zA-Z0-9]{24,}$' })`
          }

type Id = Static<typeof id>

const idSchema = Type.Object({ id })

type IdSchema = Static<typeof idSchema>

export { id, Id, idSchema, IdSchema }
export * from './user'
`,
      file: `${projectName}/src/schemas/index.ts`
    },
    user: {
      content: `import { Static, Type } from '@sinclair/typebox'

import { id } from '.'

const user = Type.Object({
  lastName: Type.String(),
  name: Type.String()
})

type User = Static<typeof user>

const userWithId = Type.Intersect([user, Type.Object({ id })])

type UserWithId = Static<typeof userWithId>

const userDto = Type.Object({
  id: Type.Optional(id),
  lastName: Type.String(),
  name: Type.String(),
  createdAt: Type.Optional(Type.String()),
  updatedAt: Type.Optional(Type.String())
})

type UserDTO = Static<typeof userDto>

const storeUserDto = Type.Object({
  args: user
})

type StoreUserDTO = Static<typeof storeUserDto>

export {
  userDto,
  UserDTO,
  userWithId,
  UserWithId,
  user,
  User,
  storeUserDto,
  StoreUserDTO
}
`,
      file: `${projectName}/src/schemas/user.ts`
    }
  }

  await Promise.all([
    writeFile(schemas.index.file, schemas.index.content),
    writeFile(schemas.user.file, schemas.user.content)
  ])
}

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {Boolean} args.dbIsSQL
 */
const services = async ({ projectName, dbIsSQL }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/services \
${projectName}/src/services/utils \
${projectName}/src/services/utils/messages`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  const services = {
    index: {
      content: "export * from './user'\n",
      file: `${projectName}/src/services/index.ts`
    },
    user: {
      content: `import httpErrors from 'http-errors'

import { store, remove, get, update } from 'database'
import { User, UserDTO, UserWithId } from 'schemas'
import { EFU, MFU, GE, errorHandling } from './utils'

type Process = {
  type: 'store' | 'getAll' | 'deleteAll' | 'getOne' | 'update' | 'delete'
}

type Arguments = {
  id?: ${dbIsSQL ? 'number' : 'string'}
  user?: User
  userWithId?: UserWithId
}

class UserService {
  #args: Arguments

  constructor(args: Arguments = {}) {
    this.#args = args
  }

  public process({ type }: Process): Promise<string | UserDTO | UserDTO[]> {
    switch (type) {
      case 'store':
        return this.#store()
      case 'getAll':
        return this.#getAll()
      case 'deleteAll':
        return this.#deleteAll()
      case 'getOne':
        return this.#getOne()
      case 'update':
        return this.#update()
      case 'delete':
        return this.#delete()
      default:
        throw new httpErrors.InternalServerError(GE.INTERNAL_SERVER_ERROR)
    }
  }

  async #store(): Promise<UserDTO> {
    try {
      if (!this.#args.user)
        throw new httpErrors.UnprocessableEntity(GE.INTERNAL_SERVER_ERROR)

      const result = await store(this.#args.user)

      return result
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  async #getAll(): Promise<UserDTO[]> {
    try {
      const users = (await get()) as UserDTO[]

      return users
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  async #deleteAll(): Promise<string> {
    try {
      const usersDeleted = (await remove()) as number

      ${
        dbIsSQL
          ? 'if (usersDeleted !== 0) return MFU.ALL_USERS_DELETED'
          : `if (usersDeleted >= 1) return MFU.ALL_USERS_DELETED

      if (usersDeleted === 0)
        throw new httpErrors.Conflict(EFU.NOTHING_TO_DELETE)`
      }

      throw new httpErrors.InternalServerError(GE.INTERNAL_SERVER_ERROR)
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  async #getOne(): Promise<UserDTO> {
    try {
      if (!this.#args.id)
        throw new httpErrors.UnprocessableEntity(GE.INTERNAL_SERVER_ERROR)

      const { id } = this.#args
      const user = (await get(id)) as UserDTO | null

      if (!user) throw new httpErrors.NotFound(EFU.NOT_FOUND)

      return user
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  async #update(): Promise<UserDTO> {
    try {
      if (!this.#args.userWithId || !this.#args.userWithId.id)
        throw new httpErrors.UnprocessableEntity(GE.INTERNAL_SERVER_ERROR)

      const updatedUser = await update(this.#args.userWithId)

      if (!updatedUser) throw new httpErrors.NotFound(EFU.NOT_FOUND)

      return updatedUser
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  async #delete(): Promise<string> {
    try {
      if (!this.#args.id)
        throw new httpErrors.UnprocessableEntity(GE.INTERNAL_SERVER_ERROR)

      const { id } = this.#args
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
    },
    utils: {
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
    'utils/messages': {
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
    }
  }

  await Promise.all([
    writeFile(services.index.file, services.index.content),
    writeFile(services.user.file, services.user.content),
    writeFile(services.utils.index.file, services.utils.index.content),
    writeFile(
      services['utils/messages'].index.file,
      services['utils/messages'].index.content
    ),
    writeFile(
      services['utils/messages'].user.file,
      services['utils/messages'].user.content
    )
  ])
}

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {Boolean} args.graphQL
 * @param {import('../../../../').Config['database']} args.database
 */
const main = async ({ projectName, graphQL, database }) => {
  const dbIsSQL = database !== 'mongo'

  await types({ projectName, graphQL, dbIsSQL })
  await network({ projectName, graphQL })
  await schemas({ projectName, graphQL, dbIsSQL })

  if (!graphQL) await services({ projectName, dbIsSQL })

  if (dbIsSQL) await sql({ projectName, db: database })
  else await mongo({ projectName })
}

module.exports = main
