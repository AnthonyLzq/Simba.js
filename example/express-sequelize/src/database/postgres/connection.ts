import { join } from 'path'
import { Sequelize } from 'sequelize-typescript'
import { HttpLogger } from 'express-pino-logger'

import * as models from './models'

let sequelize: Sequelize

const dbConnection = async (
  logger?: HttpLogger['logger']
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
