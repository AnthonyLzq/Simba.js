import { PrismaClient } from '@prisma/client'
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
        d?.('PostgreSQL connection established.')
      }

      return global.__client__
    },
    disconnect: async () => {
      if (global.__client__) {
        dbConnected = false
        await global.__client__.$disconnect()
        d?.('PostgreSQL connection closed.')
      }

      return dbConnected
    }
  }
}

export { dbConnection }
