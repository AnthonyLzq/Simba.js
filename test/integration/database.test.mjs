import knex from 'knex'
import { MongoClient } from 'mongodb'
import config from '../../scripts/db/sql/knexConfig.mjs'

describe('Database', () => {
  describe('Relational database', () => {
    describe('Create', () => {
      let db

      beforeAll(async () => {
        db = knex(config)
        await import('../../scripts/db/sql/create.mjs')
      })

      test('Table "users" should exists', async () => {
        const exists = await db.schema.hasTable('users')

        expect(exists).toBe(true)
      })

      afterAll(() => {
        db.destroy()
      })
    })

    describe('Restore', () => {
      let db

      beforeAll(async () => {
        await import('../../scripts/db/sql/restore.mjs')
        db = knex(config)
      })

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
  })

  describe('Mongo database', () => {
    describe('Create', () => {
      const url = process.env.MONGO_URI
      let client
      let db

      beforeAll(async () => {
        await import('../../scripts/db/mongo/create.mjs')
        client = await MongoClient.connect(url, {
          useNewUrlParser: true,
          useUnifiedTopology: true
        })
        await client.connect()
        db = client.db('simba')
      })

      test('Collection "users" should exists', async () => {
        const collections = await db
          .listCollections({ name: 'users' })
          .toArray()

        expect(collections.length).toBe(1)
      })

      afterAll(() => {
        client.close()
      })
    })

    describe('Restore', () => {
      const url = process.env.MONGO_URI
      let client
      let db

      beforeAll(async () => {
        await import('../../scripts/db/mongo/restore.mjs')
        client = await MongoClient.connect(url, {
          useNewUrlParser: true,
          useUnifiedTopology: true
        })
        await client.connect()
        db = client.db('simba')
      })

      test('Collection "users" should not exists', async () => {
        const collections = await db
          .listCollections({ name: 'users' })
          .toArray()

        expect(collections.length).toBe(0)
      })

      afterAll(() => {
        client.close()
      })
    })
  })
})
