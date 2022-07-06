const os = require('os')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const database = require('./database')
const schemas = require('./schemas')
const services = require('./services')
const types = require('./types')
const network = require('./network')
const utils = require('./utils')
const writeFile = require('../../utils/writeFile')
const { ENVIRONMENTS_WITH_MONGO_URI } = require('../../utils/constants')

/*
 * Express api:
 * src
 * |- @types:
 * |- |- custom:
 * |- |- |- request: content, file
 * |- |- |- response: content, file
 * |- |- dto:
 * |- |- |- user: content, file
 * |- |- models:
 * |- |- |- user: content, file
 * |  |- index: content, file
 * |- database:
 * |  |- mongo:
 * |  |- |- models:
 * |  |- |- |- index: content, file
 * |  |- |- |- user: content, file
 * |  |- |- queries:
 * |  |- |- |- index: content, file
 * |  |- |- |- user: content, file
 * |  |- |- index: content, file
 * |  |- index: content, file
 * |- network:
 * |  |- routes:
 * |  |  |- schemas:
 * |  |  |  |- user: content, file
 * |  |  |  |- index: content, file
 * |  |  |- home: content, file
 * |  |  |- index: content, file
 * |  |  |- user: content, file
 * |  |- response: content, file
 * |  |- router: content, file
 * |  |- server: content, file
 * |  |- index: content, file
 * |- services:
 * |  |- utils:
 * |  |  |- messages:
 * |  |  |  |- user: content, file
 * |  |  |  |- index: content, file
 * |  |  |- index: content, file
 * |  |- user: content, file
 * |  |- index: content, file
 * |- utils:
 * |  |- docs.json: content, file
 * |  |- index: content, file
 * |- .env: content, file
 * |- index: content, file
 * index.http: content, file
 */

/*
 * Fastify api:
 * src
 * |- @types:
 * |- |- dto:
 * |- |- |- user: content, file
 * |- |- models:
 * |- |- |- user: content, file
 * |  |- index: content, file
 * |- database:
 * |  |- mongo:
 * |  |- |- models:
 * |  |- |- |- index: content, file
 * |  |- |- |- user: content, file
 * |  |- |- queries:
 * |  |- |- |- index: content, file
 * |  |- |- |- user: content, file
 * |  |- |- index: content, file
 * |  |- index: content, file
 * |- network:
 * |  |- routes:
 * |  |  |- schemas:
 * |  |  |  |- user: content, file
 * |  |  |  |- index: content, file
 * |  |  |- home: content, file
 * |  |  |- user: content, file
 * |  |  |- index: content, file
 * |  |- response: content, file
 * |  |- router: content, file
 * |  |- server: content, file
 * |  |- index: content, file
 * |- services:
 * |  |- utils:
 * |  |  |- messages:
 * |  |  |  |- user: content, file
 * |  |  |  |- index: content, file
 * |  |  |- index: content, file
 * |  |- user: content, file
 * |  |- index: content, file
 * |- .env: content, file
 * |- index: content, file
 * index.http: content, file
 */

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {String} args.projectVersion
 * @param {String} args.email
 * @param {Boolean} args.fastify
 * @param {Boolean} args.graphql
 * @param {Boolean|undefined} args.mongo
 */
module.exports = async ({
  projectName,
  projectVersion,
  email,
  fastify,
  graphql,
  mongo = true
}) => {
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
      content: `MONGO_URI = ${
        ENVIRONMENTS_WITH_MONGO_URI.includes(process.env.NODE_ENV)
          ? process.env.MONGO_URI
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
    // /@types
    types({
      express: !fastify,
      projectName,
      graphql
    }),
    // /database
    database({
      mongo,
      projectName,
      fastify
    }),
    // /network
    network({
      fastify,
      projectName,
      graphql
    }),
    // /schemas
    schemas({ projectName, graphql }),
    // /utils
    utils({
      express: !fastify,
      projectName,
      email,
      projectVersion,
      graphql
    }),
    // .env
    writeFile(data['.env'].file, data['.env'].content),
    // index
    writeFile(data.index.file, data.index.content)
  ]

  if (!graphql)
    processes.concat([
      // /services
      services({ projectName }),
      // /test
      writeFile(data.test.index.file, data.test.index.content)
    ])

  await Promise.all(processes)
}
