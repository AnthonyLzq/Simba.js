import knex from 'knex'
import config from './knexConfig.mjs'

const db = knex(config)

await db.schema
  .createTableIfNotExists('users', table => {
    table.increments('id')
    table.string('lastName')
    table.string('name')
    table.timestamps(true, true, true)
  })
  .then(() => console.log('Table users created successfully'))
  .finally(() => db.destroy())
