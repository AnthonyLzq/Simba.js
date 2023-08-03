require('dotenv').config()
const { MongoClient } = require('mongodb')

const url = process.env.MONGO_URI

MongoClient.connect(
  url,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err, client) => {
    if (err) {
      console.error('Error in the Mongo Connection', err)
      process.exit()
    }

    console.log('Connected to the Mongo Database')
    const db = client.db()

    Promise.all([
      db
        .collection('a')
        .drop()
        .catch(err => {
          if (err.code === 26)
            console.log('The "users" collection does not exist')
          else throw err
        }),
      db
        .collection('b')
        .drop()
        .catch(err => {
          if (err.code === 26)
            console.log('The "posts" collection does not exist')
          else throw err
        })
    ])
      .then(() => console.log('Collections deleted successfully'))
      .finally(() => client.close())
  }
)
