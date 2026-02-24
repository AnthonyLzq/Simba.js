const os = require('node:os')
const util = require('node:util')
const exec = util.promisify(require('node:child_process').exec)

const express = require('./express')
const fastifyF = require('./fastify')
const honoF = require('./hono')
const writeFile = require('../../utils/writeFile')
const { renderTemplate } = require('../../utils/renderTemplate')
const { ENVIRONMENTS_WITH_DB_URI } = require('../../utils/constants')

const dbDefaultPorts = {
  mongo: 27017,
  postgres: 5432,
  mysql: 3306,
  mariadb: 3306,
  mssql: 1433
}

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {String} args.email
 * @param {Boolean} args.fastify
 * @param {Boolean} args.hono
 * @param {Boolean} args.graphql
 * @param {import('../../../').Config['database']} args.database
 * @param {import('../../../src/utils/entity').EntityContext} args.entityContext
 */
module.exports = async ({
  projectName,
  email,
  fastify,
  hono,
  graphql,
  database,
  entityContext
}) => {
  const dbIsSQL = database !== 'mongo'

  let databaseUrl = ''

  if (dbIsSQL && database !== 'sqlite')
    databaseUrl = ENVIRONMENTS_WITH_DB_URI.includes(process.env.NODE_ENV)
      ? process.env.DATABASE_URL
      : `${database}://${database}:${database}@${database}:${dbDefaultPorts[database]}/${projectName}`
  else if (database !== 'sqlite')
    databaseUrl = ENVIRONMENTS_WITH_DB_URI.includes(process.env.NODE_ENV)
      ? process.env.MONGO_URI
      : `mongodb://mongo:mongo@mongo:27017/${projectName}`

  const createFoldersCommands = `mkdir ${projectName}/src`

  if (os.platform() === 'win32')
    await exec(createFoldersCommands.replaceAll('/', '\\'))
  else await exec(createFoldersCommands)

  const processes = [
    writeFile(
      `${projectName}/.env`,
      renderTemplate('config/.env.ejs', { databaseUrl })
    ),
    writeFile(
      `${projectName}/src/index.ts`,
      renderTemplate('config/index.ts.ejs')
    )
  ]

  const frameworkArgs = {
    projectName,
    email,
    graphQL: graphql,
    database,
    entityContext
  }

  if (hono) processes.push(honoF(frameworkArgs))
  else if (fastify) processes.push(fastifyF(frameworkArgs))
  else processes.push(express(frameworkArgs))

  await Promise.all(processes)
}
