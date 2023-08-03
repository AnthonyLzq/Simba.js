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

const dbPrettyName = {
  postgres: 'PostgreSQL',
  mysql: 'MySQL',
  mariadb: 'MariaDB',
  sqlite: 'SQLite',
  sqlServer: 'SQL Server',
  mongo: 'MongoDB'
}

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {import('../../../../').Config['database']} args.db
 */
const db = async ({ projectName, db }) => {
  const isMongo = db === 'mongo'
  const createFoldersCommands = `mkdir ${projectName}/prisma \
${projectName}/src/database/${db} \
${projectName}/src/database/${db}/queries`

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
  ${
    isMongo
      ? `id       String @id @default(auto()) @map("_id") @db.ObjectId
  lastName String
  name     String`
      : `id       Int    @id @default(autoincrement())
  lastName String
  name     String`
  }

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
      index: {
        content: `export * from './connection'
export * from './queries'\n`,
        file: `${projectName}/src/database/${db}/index.ts`
      },
      connection: {
        content: `import { PrismaClient } from '@prisma/client'
import { Debugger } from 'debug'

let dbConnected = false

declare global {
  // eslint-disable-next-line no-var
  var __client__: PrismaClient
}

const dbConnection = (
  d?: Debugger
): {
  connect: () => Promise<PrismaClient>
  disconnect: () => Promise<boolean>
} => {
  return {
    connect: async () => {
      if (!global.__client__) {
        global.__client__ = new PrismaClient()
        await global.__client__.$connect()
        dbConnected = true
        d?.('${dbPrettyName[db]} connection established.')
      }

      return global.__client__
    },
    disconnect: async () => {
      if (global.__client__) {
        dbConnected = false
        await global.__client__.$disconnect()
        d?.('${dbPrettyName[db]} connection closed.')
      }

      return dbConnected
    }
  }
}

export { dbConnection }\n`,
        file: `${projectName}/src/database/${db}/connection.ts`
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

export { store, removeById, getById, update }\n`,
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
}

/**
 * @param {Object} args
 * @param {import('../../../../').Config['database']} args.database
 * @param {String} args.projectName
 */
module.exports = async ({ database, projectName }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/database`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  await db({ db: database, projectName })
}
