const knex = require('knex')
const { MongoClient } = require('mongodb')
const config = require('../../scripts/knexConfig')

const db = knex(config)

describe('Database', () => {
  describe('Relational database', () => {
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

  describe('Mongo database', () => {
    const url = process.env.MONGO_URI
    let client
    let db

    beforeAll(async () => {
      client = await MongoClient.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      })
      db = client.db()
    })

    test('Collection "users" should not exists', async () => {
      const collections = await db.listCollections({ name: 'users' }).toArray()

      expect(collections.length).toBe(0)
    })

    afterAll(() => {
      client.close()
    })
  })
})
