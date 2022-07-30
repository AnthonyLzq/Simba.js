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
  const createFoldersCommand = `mkdir ${projectName}/src/@types ${projectName}/src/@types/models ${
    graphQL ? `${projectName}/src/@types/graphQL` : ''
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
    models: {
      user: {
        content: `interface UserDBO {
  ${dbIsSQL ? 'id: number\n' : ''}name: string
  lastName: string
  createdAt: Date
  updatedAt: Date
}
`,
        file: `${projectName}/src/@types/models/user.d.ts`
      }
    },
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
  const processes = [
    writeFile(types.index.file, types.index.content),
    writeFile(types.models.user.file, types.models.user.content)
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
 */
const mongo = async ({ projectName }) => {
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
  const createFoldersCommand = `mkdir ${projectName}/src/database/${db} \
${projectName}/src/database/${db}/models \
${projectName}/src/database/${db}/queries`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  const database = {
    index: {
      content: `export * from './${db}'\n`,
      file: `${projectName}/src/database/index.ts`
    },
    [db]: {
      connection: {
        content: `import { Sequelize } from 'sequelize'
import { FastifyLoggerInstance } from 'fastify'

import { initUser } from './models'

const initArray = [initUser]
let sequelizeConnection: Sequelize

const dbConnection = async (
  logger: FastifyLoggerInstance
): Promise<{
  connect: () => Sequelize
  disconnect: () => Promise<void>
}> => {
  return {
    connect: () => {
      if (!sequelizeConnection) {
        sequelizeConnection = new Sequelize(process.env.DB_URI as string)
        initArray.forEach(initFn => initFn(sequelizeConnection))
        logger.info('Postgres connection established.')
      }

      return sequelizeConnection
    },
    disconnect: () => {
      logger.info('Postgres connection closed.')

      return sequelizeConnection?.close()
    }
  }
}

export { dbConnection }
`,
        file: `${projectName}/src/database/${db}/connection.ts`
      },
      index: {
        content: ``,
        file: `${projectName}/src/database/${db}/connection.ts`
      },
      models: {
        index: {
          content: "export * from './user'\n",
          file: `${projectName}/src/database/${db}/models/index.ts`
        },
        user: {
          content: `/* eslint-disable no-use-before-define */
import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  DataTypes,
  Sequelize
} from 'sequelize'

class UserModel extends Model<
  InferAttributes<UserModel>,
  InferCreationAttributes<UserModel>
> {
  declare id: CreationOptional<number>
  declare name: string
  declare lastName: string
  declare createdAt: CreationOptional<Date>
  declare updatedAt: CreationOptional<Date>
}

const initUser = (sequelize: Sequelize) => {
  UserModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE
    },
    {
      sequelize,
      tableName: 'users'
    }
  )
}

export { UserModel, initUser }
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
          content: `import { UserModel } from '..'
import { User, UserDTO, UserWithId } from 'schemas'
import { Transaction } from 'sequelize/types'

const userDBOtoDTO = (userDBO: UserModel): UserDTO => ({
  ...userDBO.get(),
  createdAt: userDBO.createdAt.toISOString(),
  updatedAt: userDBO.updatedAt.toISOString()
})

const store = async (
  userData: User,
  transaction: Transaction | null = null
): Promise<UserDTO> => {
  const user = await UserModel.create(userData, {
    transaction
  })

  return userDBOtoDTO(user)
}

const remove = async (
  id: number | null = null,
  transaction: Transaction | null = null
): Promise<number | null> => {
  if (id) {
    const removedUser = await UserModel.destroy({
      where: { id },
      transaction
    })

    return removedUser
  }

  const w = await UserModel.destroy({ truncate: true, transaction })

  console.log(w)

  return w
}

const get = async (
  id: number | null = null
): Promise<UserDTO[] | UserDTO | null> => {
  if (id) {
    const user = await UserModel.findByPk(id)

    return user ? userDBOtoDTO(user) : null
  }

  const { rows: users } = await UserModel.findAndCountAll()

  return users.map(u => userDBOtoDTO(u))
}

const update = async (userData: UserWithId): Promise<UserDTO | null> => {
  const { id, ...rest } = userData
  const [, user] = await UserModel.update(rest, {
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
    }
  }

  await Promise.all([
    writeFile(database.index.file, database.index.content),
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
    writeFile(database[db].queries.user.file, database[db].queries.user.content)
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

  if (dbIsSQL) await sql({ projectName, db: database })
  else await mongo({ projectName })
}

module.exports = main
