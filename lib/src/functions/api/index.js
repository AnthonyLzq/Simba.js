const os = require('os')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const express = require('./express')
const fastifyF = require('./fastify')
const utils = require('./utils')
const writeFile = require('../../utils/writeFile')
const { ENVIRONMENTS_WITH_DB_URI } = require('../../utils/constants')

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {String} args.projectVersion
 * @param {String} args.email
 * @param {Boolean} args.fastify
 * @param {Boolean} args.graphql
 * @param {import('../../../').Config['database']} args.database
 */
module.exports = async ({
  projectName,
  projectVersion,
  email,
  fastify,
  graphql,
  database
}) => {
  const dbIsSQL = database !== 'mongo'
  const data = {
    test: {
      index: {
        content: `### Testing store a user
POST http://localhost:1996/api/users
Content-Type: application/json

{
  "args": {
    "lastName": "Lzq",
    "name": "Anthony"
  }
}

### Testing getAll users
GET http://localhost:1996/api/users

### Testing deleteAll users
DELETE http://localhost:1996/api/users

### Testing getOne user
GET http://localhost:1996/api/user/60e7e3b93b01c1a7aa74cd6b

### Testing update user
PATCH http://localhost:1996/api/user/60e7e3b93b01c1a7aa74cd6b
Content-Type: application/json

{
  "args": {
    "name": "Anthony",
    "lastName": "Luzquiños"
  }
}

### Testing delete user
DELETE http://localhost:1996/api/user/60e7e3b93b01c1a7aa74cd6b
`,
        file: `${projectName}/index.http`
      }
    },
    '.env': {
      content: dbIsSQL
        ? `DB_URI = ${
            ENVIRONMENTS_WITH_DB_URI.includes(process.env.NODE_ENV)
              ? process.env.DB_URI
              : `${database}://${database}:${database}@${database}:27017/${projectName}`
          }`
        : `DB_URI = ${
            ENVIRONMENTS_WITH_DB_URI.includes(process.env.NODE_ENV)
              ? process.env.DB_URI
              : `mongodb://mongo:mongo@mongo:27017/${projectName}`
          }`,
      file: `${projectName}/.env`
    },
    index: {
      content: `import { Server } from './network'

Server.start()
`,
      file: `${projectName}/src/index.ts`
    }
  }

  const createFoldersCommands = `mkdir ${projectName}/src`

  if (os.platform() === 'win32')
    await exec(createFoldersCommands.replaceAll('/', '\\'))
  else await exec(createFoldersCommands)

  const processes = [
    // .env
    writeFile(data['.env'].file, data['.env'].content),
    // index
    writeFile(data.index.file, data.index.content),
    writeFile(data.test.index.file, data.test.index.content)
  ]

  if (fastify)
    processes.push(fastifyF({ projectName, graphQL: graphql, database }))
  else
    processes.concat([
      express({ projectName, graphQL: graphql, database }),
      // /utils
      utils({
        express: !fastify,
        projectName,
        email,
        projectVersion,
        graphql
      })
    ])

  if (!graphql)
    processes.push(
      // /test
      writeFile(data.test.index.file, data.test.index.content)
    )

  await Promise.all(processes)
}
