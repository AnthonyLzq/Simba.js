import { PrismaClient } from '@prisma/client'
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
