import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'
dotenv.config()

const url = process.env.MONGO_URI

const client = await MongoClient.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
await client.connect()

const db = client.db('simba')

const collections = await db.listCollections({ name: 'users' }).toArray()

if (collections.length > 0) {
  await db.collection('users').drop()
  console.log('Collection users deleted successfully')
} else console.log('Collection users already deleted')

client.close()
