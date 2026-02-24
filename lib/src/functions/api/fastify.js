const { platform } = require('node:os')
const { promisify } = require('node:util')
const exec = promisify(require('node:child_process').exec)

const db = require('./database')
const schemas = require('./schemas')
const services = require('./services')
const utils = require('./utils')
const writeFile = require('../../utils/writeFile')
const { renderTemplate } = require('../../utils/renderTemplate')

const t = (templatePath, data = {}) =>
  renderTemplate(`api/fastify/${templatePath}`, data)

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {Boolean} args.graphQL
 * @param {Boolean} args.dbIsSQL
 * @param {import('../../utils/entity').EntityContext} args.entityContext
 */
const types = async ({ projectName, graphQL }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/@types${graphQL ? ` ${projectName}/src/@types/graphQL` : ''}`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  const processes = [
    writeFile(`${projectName}/src/@types/index.d.ts`, t('types/index.d.ts.ejs'))
  ]

  if (graphQL)
    processes.push(
      writeFile(
        `${projectName}/src/@types/graphQL/context.d.ts`,
        t('types/graphQL/context.d.ts.ejs')
      )
    )

  await Promise.all(processes)
}

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {String} args.email
 * @param {Boolean} args.graphQL
 * @param {Boolean} args.dbIsSQL
 */
const network = async ({ projectName, email, graphQL, dbIsSQL, entityContext }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/network \
${projectName}/src/network/routes ${
    graphQL
      ? `${projectName}/src/network/models ${projectName}/src/network/resolvers`
      : ''
  }`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  const data = { graphQL, dbIsSQL, ...entityContext }
  const processes = [
    writeFile(`${projectName}/src/network/index.ts`, t('network/index.ts.ejs')),
    writeFile(
      `${projectName}/src/network/response.ts`,
      t('network/response.ts.ejs')
    ),
    writeFile(
      `${projectName}/src/network/router.ts`,
      t('network/router.ts.ejs', data)
    ),
    writeFile(
      `${projectName}/src/network/server.ts`,
      t('network/server.ts.ejs', data)
    ),
    writeFile(
      `${projectName}/src/network/routes/docs.ts`,
      t('network/routes/docs.ts.ejs', { email, ...entityContext })
    ),
    writeFile(
      `${projectName}/src/network/routes/home.ts`,
      t('network/routes/home.ts.ejs')
    ),
    writeFile(
      `${projectName}/src/network/routes/index.ts`,
      t('network/routes/index.ts.ejs', data)
    )
  ]

  if (graphQL)
    processes.push(
      writeFile(
        `${projectName}/src/network/models/index.ts`,
        t('network/models/index.ts.ejs', entityContext)
      ),
      writeFile(
        `${projectName}/src/network/models/${entityContext.Entity}.ts`,
        t('network/models/entity.ts.ejs', data)
      ),
      writeFile(
        `${projectName}/src/network/resolvers/index.ts`,
        t('network/resolvers/index.ts.ejs', entityContext)
      ),
      writeFile(
        `${projectName}/src/network/resolvers/${entityContext.Entity}.ts`,
        t('network/resolvers/entity.ts.ejs', data)
      )
    )
  else
    processes.push(
      writeFile(
        `${projectName}/src/network/routes/${entityContext.entity}.ts`,
        t('network/routes/entity.ts.ejs', entityContext)
      )
    )

  await Promise.all(processes)
}

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {String} args.email
 * @param {Boolean} args.graphQL
 * @param {import('../../../../').Config['database']} args.database
 * @param {import('../../utils/entity').EntityContext} args.entityContext
 */
const main = async ({
  projectName,
  email,
  graphQL,
  database,
  entityContext
}) => {
  const dbIsSQL = database !== 'mongo'

  await utils({ projectName })
  await types({ projectName, graphQL })
  await network({ projectName, email, graphQL, dbIsSQL, entityContext })
  await schemas({ projectName, graphQL, dbIsSQL, entityContext })
  await services({ projectName, dbIsSQL, entityContext })
  await db({ projectName, database, entityContext })
}

module.exports = main
