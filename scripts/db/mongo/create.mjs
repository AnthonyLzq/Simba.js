import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'
dotenv.config()

const url = process.env.MONGO_URI

const client = await MongoClient.connect(url)
await client.connect()

const db = client.db('simba')

const collections = await db.listCollections({ name: 'users' }).toArray()

if (collections.length === 0) {
  await db.createCollection('users')
  console.log('Collection users created successfully')
} else console.log('Collection users already exists')

client.close()
