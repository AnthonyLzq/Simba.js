import knex from 'knex'
import config from './knexConfig.mjs'

const db = knex(config)

await db.schema
  .dropTableIfExists('_prisma_migrations')
  .then(() => db.schema.dropTableIfExists('users'))
  .then(() => console.log('Tables deleted successfully'))
  .finally(() => db.destroy())
