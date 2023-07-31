const { platform } = require('os')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const writeFile = require('../../utils/writeFile')

const dbPrismaName = {
  postgres: 'postgresql',
  mysql: 'mysql',
  mariadb: 'mysql',
  sqlite: 'sqlite',
  sqlServer: 'sqlserver',
  mongo: 'mongodb'
}

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {Boolean} args.fastify
 */
const mongo = async ({ projectName, fastify }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/database/mongo \
${projectName}/src/database/mongo/models \
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
        content: fastify
          ? `import { connect, connection } from 'mongoose'
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
        connect(process.env.DATABASE_URL as string, {
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
    connect: () => connect(process.env.DATABASE_URL as string, connectionConfig),
    disconnect: () => connection.close()
  }
}

export { dbConnection }
`
          : `import { connect, connection } from 'mongoose'
import { HttpLogger } from 'express-pino-logger'

const ENVIRONMENTS_WITHOUT_RECONNECTION = ['ci', 'local']
const dbConnection = async (
  logger: HttpLogger['logger']
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
        connect(process.env.DATABASE_URL as string, {
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
    connect: () => connect(process.env.DATABASE_URL as string, connectionConfig),
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
 * @param {String} args.db
 */
const sql = async ({ projectName, db }) => {
  const createFoldersCommands = `mkdir ${projectName}/prisma \
${projectName}/src/database/postgres ${projectName}/src/database/postgres/models \
${projectName}/src/database/postgres/queries`

  if (platform() === 'win32')
    await exec(createFoldersCommands.replaceAll('/', '\\'))
  else await exec(createFoldersCommands)

  const database = {
    schema: {
      content: `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${dbPrismaName[db]}"
  url      = env("DATABASE_URL")
}

model User {
  id       Int    @id @default(autoincrement())
  lastName String
  name     String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
`,
      file: `${projectName}/prisma/schema.prisma`
    },
    index: {
      content: `export * from './${db}'\n`,
      file: `${projectName}/src/database/index.ts`
    },
    [db]: {
      connection: {
        content: `import { PrismaClient } from '@prisma/client'
import { Debugger } from 'debug'

let dbConnected = false

declare global {
  // eslint-disable-next-line no-var
  var __postgresDb__: PrismaClient
}

const dbConnection = (
  d?: Debugger
): {
  connect: () => Promise<PrismaClient>
  disconnect: () => Promise<boolean>
} => {
  return {
    connect: async () => {
      if (!global.__postgresDb__) {
        global.__postgresDb__ = new PrismaClient()
        await global.__postgresDb__.$connect()
        dbConnected = true
        d?.('Postgres connection established.')
      }

      return global.__postgresDb__
    },
    disconnect: async () => {
      if (global.__postgresDb__) {
        dbConnected = false
        await global.__postgresDb__.$disconnect()
        d?.('Postgres connection closed.')
      }

      return dbConnected
    }
  }
}

export { dbConnection }
`,
        file: `${projectName}/src/database/${db}/connection.ts`
      },
      index: {
        content: `export * from './connection'
export * from './queries'\n`,
        file: `${projectName}/src/database/${db}/index.ts`
      },
      queries: {
        index: {
          content: "export * from './user'\n",
          file: `${projectName}/src/database/${db}/queries/index.ts`
        },
        user: {
          content: `import { User } from '@prisma/client'
import debug from 'debug'

import { dbConnection } from '../connection'
import { Id, User as UserSchema, UserDTO } from 'schemas'
import { Logger } from 'utils'

const LOGGER = new Logger(debug('App:Database:Queries:User'))

const userDBOtoDTO = (userDBO: User): UserDTO =>
  ({
    ...userDBO,
    createdAt: userDBO.createdAt.toISOString(),
    updatedAt: userDBO.updatedAt.toISOString()
  }) as UserDTO

const store = async (userData: UserSchema) => {
  try {
    const client = await dbConnection().connect()
    const user = await client.user.create({
      data: userData
    })

    return userDBOtoDTO(user)
  } catch (error) {
    LOGGER.log({
      origin: 'queries/user.ts',
      method: store.name,
      value: 'error',
      content: error
    })

    return null
  }
}

const removeById = async (id: Id) => {
  try {
    const client = await dbConnection().connect()
    await client.user.delete({
      where: { id }
    })

    return true
  } catch (error) {
    LOGGER.log({
      origin: 'queries/user.ts',
      method: removeById.name,
      value: 'error',
      content: error
    })

    return false
  }
}

const getById = async (id: Id) => {
  try {
    const client = await dbConnection().connect()
    const user = await client.user.findUnique({
      where: { id }
    })

    if (!user) return null

    return userDBOtoDTO(user)
  } catch (error) {
    LOGGER.log({
      origin: 'queries/user.ts',
      method: getById.name,
      value: 'error',
      content: error
    })

    return null
  }
}

const update = async (id: Id, user: UserSchema) => {
  try {
    const client = await dbConnection().connect()
    const userUpdated = await client.user.update({
      where: { id },
      data: user
    })

    if (!userUpdated) return null

    return userDBOtoDTO(userUpdated)
  } catch (error) {
    LOGGER.log({
      origin: 'queries/user.ts',
      method: update.name,
      value: 'error',
      content: error
    })

    return null
  }
}

export { store, removeById, getById, update }
`,
          file: `${projectName}/src/database/${db}/queries/user.ts`
        }
      }
    }
  }

  await Promise.all([
    writeFile(database.schema.file, database.schema.content),
    writeFile(database.index.file, database.index.content),
    writeFile(database[db].connection.file, database[db].connection.content),
    writeFile(database[db].index.file, database[db].index.content),
    writeFile(
      database[db].queries.index.file,
      database[db].queries.index.content
    ),
    writeFile(database[db].queries.user.file, database[db].queries.user.content)
  ])

  const prismaMigrate = 'npx prisma migrate dev --name init'

  await exec(prismaMigrate, { cwd: projectName })
}

/**
 * @param {Object} args
 * @param {import('../../../../').Config['database']} args.database
 * @param {String} args.projectName
 * @param {Boolean} args.fastify
 */
module.exports = async ({ database, projectName, fastify }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/database`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  if (database === 'mongo') await mongo({ projectName, fastify })
  else await sql({ db: database, projectName, fastify })
}
