const { platform } = require('os')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const writeFile = require('../../utils/writeFile')

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {Boolean} args.fastify
 */
const mongoF = async ({ projectName, fastify }) => {
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
        connect(process.env.DB_URI as string, {
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
    connect: () => connect(process.env.DB_URI as string, connectionConfig),
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
        connect(process.env.DB_URI as string, {
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
    connect: () => connect(process.env.DB_URI as string, connectionConfig),
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
 * @param {Boolean|undefined} args.mongo
 * @param {String} args.projectName
 * @param {Boolean} args.fastify
 */
module.exports = async ({ mongo = true, projectName, fastify }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/database`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  if (mongo) await mongoF({ projectName, fastify })
}
