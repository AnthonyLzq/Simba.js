const knex = require('knex')
const config = require('./knexConfig')

const db = knex(config)

db.schema
  .dropTableIfExists('_prisma_migrations')
  .then(() => db.schema.dropTableIfExists('users'))
  .then(() => console.log('Tables deleted successfully'))
  .catch(err => console.error('There was an error deleting the tables', err))
  .finally(() => db.destroy())
