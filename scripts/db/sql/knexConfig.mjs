import dotenv from 'dotenv'
dotenv.config()

export default {
  client: 'pg',
  connection: process.env.DATABASE_URL
}
