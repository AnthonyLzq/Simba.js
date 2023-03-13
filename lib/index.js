const prompts = require('prompts')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const {
  constants: {
    PACKAGE_MANAGERS,
    ONE_CHARACTER_REGEX,
    UNLICENSED,
    LICENSES,
    DATABASES,
    YEAR_REGEX,
    EMAIL_REGEX,
    PROJECT_VERSION,
    MAIN_FILE
  }
} = require('./src/utils')
const POSSIBLE_LICENSES = Object.keys(LICENSES)

const installation = require('./src')

const CURRENT_YEAR = `${new Date().getFullYear()}`
const argv = yargs(hideBin(process.argv))
  .version(false)
  // Pending to test it using npx
  .usage(
    '"simba [options]" (if you it installed globally) or only "simba -q" if you want to be asked for the options one by one.'
  )
  .example(
    "simba -N 'Project Name' -D 'Project description' -a Anthony -e sluzquinosa@uni.pe -l mit -F -t -d mongo --ghat"
  )
  .alias('N', 'projectName')
  .nargs('N', 1)
  .describe('N', 'Project name.')
  .alias('D', 'projectDescription')
  .nargs('D', 1)
  .describe('D', 'Project description.')
  .alias('a', 'author')
  .nargs('a', 1)
  .describe('a', 'Author of the project.')
  .alias('e', 'email')
  .nargs('e', 1)
  .describe('e', 'Email of the author.')
  .alias('l', 'license')
  .nargs('l', 1)
  .describe(
    'l',
    'Type of license for the project, it can be one of: MIT, Apache 2.0, MPL 2.0, LGPL 3.0, GPL 3.0 and AGPL 3.0, in lowercase without its version.'
  )
  .alias('v', 'version')
  .nargs('v', 1)
  .describe('v', 'Project initial version.')
  .alias('y', 'licenseYear')
  .nargs('y', 1)
  .describe('y', 'Year when the license starts.')
  .alias('m', 'manager')
  .describe(
    'm',
    'Which package manager you want to use, available package managers are: npm, yarn and pnpm.'
  )
  .alias('f', 'mainFile')
  .nargs('f', 1)
  .describe('f', 'Main file of the project.')
  .alias('q', 'questions')
  .describe(
    'q',
    'Whether or not you want to be asked to answer the questions related to the project one by one.'
  )
  .alias('F', 'fastify')
  .describe('F', 'Whether or not you want to use Fastify for your project.')
  .alias('g', 'graphql')
  .describe('g', 'Whether or not you want to use GraphQL for your project.')
  .alias('ghat', 'gh-action-tests')
  .describe(
    'ghat',
    'Whether or not you want to have a GitHub Action with a CI for your tests and linting. If this option is set to true, the tests flag must be set to true.'
  )
  .describe(
    'd',
    'Which database you want to use, available databases are: MongoDB (mongo), PostgreSQL (postgres), MySQL (mysql), MariaDB (mariadb), Sqlite (sqlite) and Microsoft SQL Server (sqlServer).'
  )
  .alias('d', 'database')
  .nargs('d', 1)
  .default({
    y: CURRENT_YEAR,
    l: 'unlicensed',
    v: '0.1.0',
    f: 'src/index.ts',
    q: false,
    F: false,
    g: false,
    ghat: false,
    d: 'mongo'
  })
  .boolean(['q', 'F', 'g'])
  .help('h')
  .alias('h', 'help')
  .epilog('Developed by AnthonyLzq').argv

/** @type {Config} */
const config = {
  author: '',
  email: '',
  projectName: '',
  projectDescription: '',
  license: 'unlicensed',
  version: PROJECT_VERSION,
  licenseYear: CURRENT_YEAR,
  manager: 'pnpm i',
  mainFile: MAIN_FILE,
  fastify: false,
  graphql: false,
  tests: true,
  ghat: true,
  database: 'mongo'
}

const main = async () => {
  if (argv.q) {
    const responses = await prompts(
      [
        {
          type: 'text',
          name: 'projectName',
          message: 'Project name:',
          validate: value =>
            !ONE_CHARACTER_REGEX.test(value)
              ? 'The project must have a name!'
              : true,
          format: value => value.toLowerCase()
        },
        {
          type: 'text',
          name: 'projectDescription',
          message: 'Project description:',
          validate: value =>
            !ONE_CHARACTER_REGEX.test(value)
              ? 'The project must have a description!'
              : true
        },
        {
          type: 'select',
          name: 'manager',
          message: 'Select your package manager:',
          choices: PACKAGE_MANAGERS.map(pm => ({
            title: pm,
            value: pm === 'yarn' ? `${pm} add` : `${pm} i`
          }))
        },
        {
          type: 'text',
          name: 'author',
          message: 'Author:',
          validate: value =>
            !ONE_CHARACTER_REGEX.test(value)
              ? 'The project must have an author!'
              : true
        },
        {
          type: 'text',
          name: 'email',
          message: 'Email:',
          validate: value =>
            !EMAIL_REGEX.test(value) ? 'Please, give us a valid email.' : true
        },
        {
          type: 'text',
          name: 'version',
          message: 'Project version:',
          initial: '0.1.0'
        },
        {
          type: 'select',
          name: 'license',
          message: 'License:',
          choices: Object.entries(LICENSES).map(([key, value]) => ({
            title: value,
            value: key
          }))
        },
        {
          type: 'text',
          name: 'licenseYear',
          message: 'License year:',
          initial: `${new Date().getFullYear()}`,
          validate: value =>
            !YEAR_REGEX.test(value) ? 'Please, give us a valid year.' : true
        },
        {
          type: 'toggle',
          name: 'ghat',
          message:
            'Would you want to have a basic GitHub Action for the suit of tests and linting?',
          active: 'yes',
          inactive: 'no'
        },
        {
          type: 'text',
          name: 'mainFile',
          message: 'Main file:',
          initial: 'src/index.ts'
        },
        {
          type: 'select',
          name: 'framework',
          message: 'Express or Fastify?',
          choices: [
            { title: 'Express', value: 'express' },
            { title: 'Fastify', value: 'fastify' }
          ]
        },
        {
          type: 'toggle',
          name: 'graphql',
          message: 'Will this project use GraphQL?',
          active: 'yes',
          inactive: 'no'
        },
        {
          type: 'select',
          name: 'database',
          message: 'Which database do you want to use?',
          choices: Object.entries(DATABASES).map(([key, value]) => ({
            title: value,
            value: key
          }))
        }
      ],
      {
        onCancel: () => {
          console.log('Simba.js process cancelled')
          process.exit()
        }
      }
    )

    config.author = responses.author
    config.email = responses.email
    config.projectName = responses.projectName
    config.projectDescription = responses.projectDescription
    config.license = responses.license
    config.version = responses.version
    config.licenseYear = responses.licenseYear
    config.manager = responses.manager
    config.mainFile = responses.mainFile
    config.fastify = responses.framework === 'fastify'
    config.graphql = responses.graphql
    config.database = responses.database
    config.ghat = responses.ghat
  } else {
    if (!argv.author) return console.log('Error! An author is required!')
    else config.author = argv.author

    if (!argv.email) return console.log('Error! An email is required!')
    else {
      if (!EMAIL_REGEX.test(argv.email))
        return console.log('That is not a valid email!')

      config.email = argv.email
    }

    if (!argv.projectName)
      return console.log('Error! A project name is required!')
    else if (argv.projectName.includes(' '))
      config.projectName = argv.projectName.replace(/ /g, '-')
    else config.projectName = argv.projectName

    if (!argv.projectDescription)
      return console.log('Error! A project description is required')
    else config.projectDescription = argv.projectDescription

    if (argv.fastify) config.fastify = true

    if (!argv.license || argv.license === UNLICENSED)
      console.log('License was not provided')
    else {
      if (!POSSIBLE_LICENSES.includes(argv.license.toLowerCase()))
        return console.log(
          'Wrong license, licenses available are: MIT, Apache 2.0, MPL 2.0, LGPL 3.0, GPL 3.0 and AGPL 3.0. Please, provide one of then in lowercase without its version in case you want to have a license, otherwise skip license argument'
        )

      switch (argv.license) {
        case POSSIBLE_LICENSES[0]:
          config.license = argv.license
          break
        case POSSIBLE_LICENSES[1]:
        case POSSIBLE_LICENSES[2]:
          config.license = `${argv.license}-2.0`
          break
        case POSSIBLE_LICENSES[3]:
        case POSSIBLE_LICENSES[4]:
        case POSSIBLE_LICENSES[5]:
          config.license = `${argv.license}-3.0`
          break
      }
    }

    if (!argv.licenseYear)
      console.log(
        `Year license was not provided, using ${config.licenseYear} as default`
      )
    else if (!YEAR_REGEX.test(config.licenseYear))
      return console.log(
        'Year license format was wrong, please provide a YYYY format'
      )

    if (!argv.version)
      console.log('Initial version wa not provided, using 0.1.0 as default')
    else config.version = argv.version

    if (!argv.manager) console.log('Using pnpm as default package manager')
    else {
      argv.manager = argv.manager.toLowerCase()
      config.manager =
        argv.manager === 'yarn' ? `${argv.manager} add` : `${argv.manager} i`
    }

    if (argv.graphql) config.graphql = true

    if (!argv.mainFile) console.log('Using src/index.ts as default main file')
    else config.mainFile = argv.mainFile

    if (argv.ghat) config.ghat = true

    if (argv.database) config.database = argv.database
  }

  await installation(config)
}

module.exports = main

/**
 * @typedef {Object} Config configuration to initialize a project
 * @property {String} author author of the project
 * @property {String} email email of the project author
 * @property {String} projectName project name
 * @property {String} projectDescription project description
 * @property {'unlicensed'|'mit'|'apache-2.0'|'mpl-2.0'|'lgpl-3.0'|'gpl-3.0'|'agpl-3.0'} license project license
 * @property {String} version project initial version
 * @property {String} licenseYear year when the license starts in format YYYY
 * @property {'yarn add'|'npm i'|'pnpm i'} manager command that will be used to install packages
 * @property {String} mainFile main file of the project
 * @property {Boolean} fastify true means that the project will be using Fastify
 * @property {Boolean} graphql true means that the project will be using GraphQL
 * @property {'mongo'|'postgres'|'mysql'|'mariadb'|'sqlite'|'sqlServer'} database project database
 */
