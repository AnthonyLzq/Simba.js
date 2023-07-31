const knex = require('knex')
const config = require('../../scripts/knexConfig')

const db = knex(config)

describe('Database', () => {
  test('Table "_prisma_migrations" should not exists', async () => {
    const exists = await db.schema.hasTable('_prisma_migrations')

    expect(exists).toBe(false)
  })

  test('Tables "users" should not exists', async () => {
    const exists = await db.schema.hasTable('users')

    expect(exists).toBe(false)
  })

  afterAll(() => {
    db.destroy()
  })
})
