const cliProgress = require('cli-progress')
const pc = require('picocolors')
const util = require('node:util')
const exec = util.promisify(require('node:child_process').exec)
const mkdirs = require('./utils/mkdirs')

const {
  packageJson,
  readme,
  changelog,
  licenseF,
  gitignore,
  tsconfig,
  biome,
  docker,
  api,
  testsF,
  ghat: ghatF
} = require('./functions')

/**
 * @param {Number} process number of process
 * @returns {CliOptions}
 */
const setOptions = process => {
  const format = `${pc.bold(
    'Packages installation progress'
  )} ${pc.cyan('[{bar}]')} ${pc.blue('{percentage}%')} | ${pc.bold(
    'Current process:'
  )} ${pc.yellow('{value}')} of ${process} | ${pc.bold(
    'Duration:'
  )} ${pc.green('{duration_formatted}')}`

  return { format, hideCursor: false, synchronousUpdate: false }
}

/**
 * @param {import('../').Config} config configuration to build the project
 */
module.exports = async ({
  author,
  email,
  projectName,
  projectDescription,
  license,
  version,
  licenseYear,
  manager,
  mainFile,
  fastify,
  hono,
  graphql,
  ghat,
  database,
  entityContext
}) => {
  const process = 5
  let i = 0
  const options = setOptions(process)
  const bar = new cliProgress.SingleBar(
    options,
    cliProgress.Presets.shades_classic
  )
  const expressProdPackages =
    'express swagger-ui-express @asteasolutions/zod-to-openapi cors'
  const fastifyProdPackages = `fastify @fastify/swagger @fastify/swagger-ui @fastify/cors fastify-type-provider-zod ${
    graphql ? '@as-integrations/fastify' : ''
  }`
  const honoProdPackages =
    'hono @hono/node-server @hono/zod-openapi @hono/swagger-ui'

  const frameworkProdPackages = hono
    ? honoProdPackages
    : fastify
      ? fastifyProdPackages
      : expressProdPackages

  let prodPackages = `${manager} debug zod http-errors @prisma/client@6 ${
    graphql
      ? `@apollo/server ${
          !fastify && !hono ? '@as-integrations/express5' : ''
        } class-validator graphql graphql-scalars reflect-metadata type-graphql@2.0.0-rc.3`
      : ''
  } ${frameworkProdPackages}`

  switch (database) {
    case 'mongo':
      prodPackages += ' mongodb '
      break
    case 'postgres':
      prodPackages += ' pg pg-hstore '
      break
    case 'mysql':
      prodPackages += ' mysql2 '
      break
    case 'mariadb':
      prodPackages += ' mariadb '
      break
    case 'sqlite':
      prodPackages += ' sqlite3 '
      break
    case 'sqlServer':
      prodPackages += ' tedious '
      break
    default:
      throw new Error('Database not supported')
  }

  let devPackages = `${manager} -D prisma@6 @types/debug @types/http-errors \
@types/node \
@biomejs/biome \
axios \
dotenv \
nodemon \
commit-and-tag-version \
tsx \
typescript`

  const expressDevPackages =
    '@types/express @types/swagger-ui-express @types/cors'
  const fastifyDevPackages = ''
  const honoDevPackages = ''

  devPackages += ` ${
    hono ? honoDevPackages : fastify ? fastifyDevPackages : expressDevPackages
  } vitest vite-tsconfig-paths`

  if (graphql) devPackages += ' unplugin-swc @swc/core'

  // Biome no necesita plugins adicionales de Vitest como ESLint

  bar.start(process, i)

  try {
    await mkdirs(projectName)
    bar.update(++i)

    const dbIsSQL = database !== 'mongo'
    const functions = [
      packageJson({
        author: `${author} <${email}>`,
        projectName,
        projectDescription,
        projectVersion: version,
        license,
        mainFile
      }),
      readme(projectName, projectDescription),
      changelog(projectName),
      gitignore(projectName),
      tsconfig({ projectName, graphQL: graphql }),
      biome({ projectName }),
      docker({ projectName, manager }),
      api({
        projectName,
        email,
        fastify,
        hono,
        graphql,
        database,
        entityContext
      }),
      testsF({ projectName, graphql, dbIsSQL, entityContext }),
      exec('git init', { cwd: `./${projectName}` })
    ]

    if (license !== 'unlicensed')
      functions.push(
        licenseF({
          author,
          license,
          year: licenseYear,
          projectDescription,
          projectName
        })
      )

    if (ghat) functions.push(ghatF(projectName, manager))

    await Promise.all(functions)
    bar.update(++i)

    await exec(prodPackages, { cwd: `./${projectName}` })
    bar.update(++i)

    await exec(devPackages, { cwd: `./${projectName}` })
    bar.update(++i)

    await exec('npx prisma generate', { cwd: projectName })
    bar.update(++i)

    bar.stop()
  } catch (e) {
    console.error('\nerror', e)
  }
}

/**
 * @typedef {Object} CliOptions
 * @property {String} format cli format to show the progress to the user
 * @property {Boolean} hideCursor
 * @property {Boolean} synchronousUpdate
 */
