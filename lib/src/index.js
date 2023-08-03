const cliProgress = require('cli-progress')
const colors = require('colors')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const {
  packageJson,
  readme,
  changelog,
  licenseF,
  gitignore,
  tsconfig,
  eslint,
  docker,
  api,
  testsF,
  ghatF
} = require('./functions')

/**
 * @param {Number} process number of process
 * @returns {CliOptions}
 */
const setOptions = process => {
  const format = `${colors.bold(
    'Packages installation progress'
  )} ${colors.cyan('[{bar}]')} ${colors.blue('{percentage}%')} | ${colors.bold(
    'Current process:'
  )} ${colors.yellow('{value}')} of ${process} | ${colors.bold(
    'Duration:'
  )} ${colors.green('{duration_formatted}')}`

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
  graphql,
  ghat,
  database
}) => {
  const process = 5
  let i = 0
  const options = setOptions(process)
  const bar = new cliProgress.SingleBar(
    options,
    cliProgress.Presets.shades_classic
  )
  const expressProdPackages = `express swagger-ui-express cors ${
    graphql ? 'apollo-server-express' : ''
  }`
  const fastifyProdPackages = `fastify @fastify/swagger @fastify/swagger-ui @fastify/cors fastify-type-provider-zod ${
    graphql ? '@as-integrations/fastify' : ''
  }`
  let prodPackages = `${manager} debug zod http-errors @prisma/client ${
    graphql
      ? '@apollo/server class-validator graphql reflect-metadata type-graphql@2.0.0-beta.1'
      : ''
  } ${fastify ? fastifyProdPackages : expressProdPackages}`

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

  let devPackages = `${manager} -D prisma @types/debug @types/http-errors \
@types/node \
@typescript-eslint/eslint-plugin \
@typescript-eslint/parser \
axios \
dotenv \
eslint \
eslint-config-prettier \
eslint-config-standard \
eslint-plugin-import \
eslint-plugin-node \
eslint-plugin-prettier \
eslint-plugin-promise \
nodemon \
prettier \
standard-version \
ts-loader \
ts-node \
tsconfig-paths \
typescript`

  const expressDevPackages =
    '@types/express @types/swagger-ui-express @types/cors @types/express-pino-logger'
  const fastifyDevPackages = ''

  devPackages += ` ${
    fastify ? fastifyDevPackages : expressDevPackages
  } @jest/types @types/jest eslint-plugin-jest jest jest-unit ts-jest`

  if (manager === 'yarn add') devPackages += ' eslint-plugin-n'

  bar.start(process, i)

  try {
    await exec(`mkdir ${projectName}`)
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
      tsconfig(projectName, graphql),
      eslint({ projectName, dbIsSQL }),
      docker({ projectName, manager }),
      api({ projectName, version, email, fastify, graphql, database }),
      testsF({ projectName, graphql, dbIsSQL }),
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
