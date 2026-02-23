const cliProgress = require('cli-progress')
const colors = require('colors')
const util = require('node:util')
const exec = util.promisify(require('node:child_process').exec)

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
  const expressProdPackages = 'express swagger-ui-express cors'
  const fastifyProdPackages = `fastify @fastify/swagger @fastify/swagger-ui @fastify/cors fastify-type-provider-zod ${
    graphql ? '@as-integrations/fastify' : ''
  }`
  let prodPackages = `${manager} debug zod http-errors @prisma/client@6 ${
    graphql
      ? `@apollo/server ${!fastify ? '@as-integrations/express5' : ''} class-validator graphql graphql-scalars reflect-metadata type-graphql@2.0.0-rc.3`
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

  let devPackages = `${manager} -D prisma@6 @types/debug @types/http-errors \
@types/node \
@biomejs/biome \
axios \
dotenv \
nodemon \
standard-version \
ts-loader \
ts-node \
tsconfig-paths \
typescript`

  const expressDevPackages =
    '@types/express @types/swagger-ui-express @types/cors'
  const fastifyDevPackages = ''

  devPackages += ` ${
    fastify ? fastifyDevPackages : expressDevPackages
  } @jest/types @types/jest jest jest-unit ts-jest`

  // Biome no necesita plugins adicionales de Jest como ESLint

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
      tsconfig(projectName),
      biome({ projectName }),
      docker({ projectName, manager }),
      api({
        projectName,
        projectVersion: version,
        email,
        fastify,
        graphql,
        database
      }),
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
