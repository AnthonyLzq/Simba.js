const readLineSync = require('readline-sync')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

const installation = require('./src/installation')

const CURRENT_YEAR = `${new Date().getFullYear()}`
const argv = yargs(hideBin(process.argv))
  .version(false)
  .usage('Usage: npx simba [options] or simba [options] (if you it installed globally) or only simba if you want to be asked for the options one by one')
  .example('simba -a Anthony -e sluzquinosa@uni.pe -N "Project Name" -D "Project description"')
  .alias('a', 'author')
  .nargs('a', 1)
  .describe('a', 'Author of the project')
  .alias('e', 'email')
  .nargs('e', 1)
  .describe('e', 'Email of the author')
  .alias('N', 'projectName')
  .nargs('N', 1)
  .describe('N', 'Project name')
  .alias('D', 'projectDescription')
  .nargs('D', 1)
  .describe('D', 'Project description')
  .alias('H', 'heroku')
  .describe('H', 'Whether or not the project will be deployed using Heroku')
  .alias('l', 'license')
  .nargs('l', 1)
  .describe('l', 'Type of license for the project, it can be one of: MIT, Apache 2.0, MPL 2.0, LGPL 3.0, GPL 3.0 and AGPL 3.0, in lowercase without its version')
  .alias('v', 'version')
  .nargs('v', 1)
  .describe('v', 'Project initial version')
  .alias('y', 'licenseYear')
  .nargs('y', 1)
  .describe('y', 'Year when the license starts')
  .alias('n', 'npm')
  .describe('n', 'Whether or not the project should use npm as package manager')
  .alias('f', 'mainFile')
  .nargs('f', 1)
  .describe('f', 'Main file of the project')
  .alias('q', 'questions')
  .describe('q', 'Whether or not you want to be asked to answer the questions related to the project one by one')
  .default({
    H: false,
    n: false,
    y: CURRENT_YEAR,
    l: 'unlicense',
    v: '0.1.0',
    f: 'src/index.ts',
    q: false
  })
  .boolean(['H', 'n', 'q'])
  .help('h')
  .alias('h', 'help')
  .epilog('Developed by AnthonyLzq')
  .argv

/** @type {Config} */
const config = {
  author            : '',
  email             : '',
  projectName       : '',
  projectDescription: '',
  heroku            : false,
  license           : 'unlicense',
  version           : '0.1.0',
  licenseYear       : CURRENT_YEAR,
  npm               : false,
  manager           : 'yarn add',
  mainFile          : 'src/index.ts'
}
const LICENSES = [
  'MIT',
  'Unlicensed',
  'Apache 2.0',
  'MPL 2.0',
  'LGPL 3.0',
  'GPL 3.0',
  'AGPL 3.0'
]
const POSSIBLE_LICENSES = ['mit', 'apache', 'mpl', 'lgpl', 'gpl', 'agpl']
const ONE_CHARACTER_REGEXP = /^\w/
const YEAR_REGEXP = /^\d{4}$/
const EMAIL_REGEXP =
  /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i

const main = async () => {
  if (argv.q) {
    readLineSync.promptCLLoop(
      {
        npm: () => {
          config.npm = true

          return true
        },
        yarn: () => true
      },
      {
        caseSensitive: false,
        limitMessage : 'That is not a valid option',
        prompt       : '> Yarn or npm? '
      }
    )

    if (config.npm) config.manager = 'npm i'

    readLineSync.promptLoop(
      input => {
        config.projectName = input.toLowerCase()

        return config.projectName !== ''
      },
      {
        limit       : ONE_CHARACTER_REGEXP,
        limitMessage: 'The project must have a name!',
        prompt      : '> Project name: '
      }
    )

    readLineSync.promptLoop(
      input => {
        config.projectDescription = input

        return config.projectDescription !== ''
      },
      {
        limit       : ONE_CHARACTER_REGEXP,
        limitMessage: 'The project must have a description!',
        prompt      : '> Project description: '
      }
    )

    readLineSync.promptLoop(
      input => {
        config.author = input

        return config.author !== ''
      },
      {
        limit       : ONE_CHARACTER_REGEXP,
        limitMessage: 'The project must have an author!',
        prompt      : '> Author: '
      }
    )

    config.email = readLineSync.questionEMail('> Email: ', {
      limit       : EMAIL_REGEXP,
      limitMessage: 'That is not a valid email!'
    })

    config.version = readLineSync.question('> Project version (0.1.0): ')
    config.version = config.version === '' ? '0.1.0' : config.version

    const licensePos = readLineSync.keyInSelect(
      LICENSES,
      '> Select your license: ',
      {
        cancel: false
      }
    )

    config.license = LICENSES[licensePos]
      .toLowerCase()
      .replace(/ /g, '-')
      .replace('d', '')

    readLineSync.promptLoop(
      input => {
        if (input !== '') config.licenseYear = input

        return YEAR_REGEXP.test(config.licenseYear)
      },
      {
        limit       : [YEAR_REGEXP, ''],
        limitMessage: 'That is not a valid license year!',
        prompt      : `> License year (${config.licenseYear}): `
      }
    )

    config.heroku = readLineSync.keyInYNStrict(
      '> Will this project be deployed with Heroku? ',
      {
        caseSensitive: false
      }
    )

    config.mainFile = readLineSync.question('> Main file (src/index.ts): ')
  } else {
    if (!argv.author) return console.log('Error! An author is required!')
    else config.author = argv.author

    if (!argv.email) return console.log('Error! An email is required!')
    else {
      if (!EMAIL_REGEXP.test(argv.email))
        return console.log('That is not a valid email!')

      config.email = argv.email
    }

    if (!argv.projectName)
      return console.log('Error! A project name is required!')
    else config.projectName = argv.projectName

    if (!argv.projectDescription)
      return console.log('Error! A project description is required')
    else config.projectDescription = argv.projectDescription

    if (argv.heroku) config.heroku = true

    if (!argv.license) console.log('License was not provided')
    else {
      if (!POSSIBLE_LICENSES.includes(argv.license.toLowerCase()))
        return console.log(
          'Wrong license, licenses available are: MIT, Apache 2.0, MPL 2.0, LGPL 3.0, GPL 3.0 and AGPL 3.0. Please, provide one of then in lowercase without its version in case you want to have a license, otherwise skip license argument'
        )

      switch (argv.license) {
        case POSSIBLE_LICENSES[0]:
          config.license = POSSIBLE_LICENSES[0]
          break
        case POSSIBLE_LICENSES[1]:
          config.license = `${POSSIBLE_LICENSES[1]}-2.0`
          break
        case POSSIBLE_LICENSES[2]:
          config.license = `${POSSIBLE_LICENSES[2]}-2.0`
          break
        case POSSIBLE_LICENSES[3]:
          config.license = `${POSSIBLE_LICENSES[3]}-3.0`
          break
        case POSSIBLE_LICENSES[4]:
          config.license = `${POSSIBLE_LICENSES[4]}-3.0`
          break
        case POSSIBLE_LICENSES[5]:
          config.license = `${POSSIBLE_LICENSES[5]}-3.0`
          break
      }
    }

    if (!argv.licenseYear)
      console.log(
        `Year license was not provided, using ${config.licenseYear} as default`
      )
    else if (!YEAR_REGEXP.test(config.licenseYear))
      return console.log(
        'Year license format was wrong, please provide a YYYY format'
      )

    if (!argv.version)
      console.log('Initial version wa not provided, using 0.1.0 as default')
    else config.version = argv.version

    if (!argv.npm) console.log('Using yarn as default package manager')
    else {
      config.npm = true
      config.manager = 'npm i'
    }

    if (!argv.mainFile) console.log('Using src/index.ts as default main file')
    else config.mainFile = argv.mainFile
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
 * @property {Boolean} heroku true if the project will be deployed in heroku
 * @property {'unlicense'|'mit'|'apache-2.0'|'mpl-2.0'|'lgpl-3.0'|'gpl-3.0'|'agpl-3.0'} license project license
 * @property {String} version project initial version
 * @property {String} licenseYear year when the license starts in format YYYY
 * @property {Boolean} npm true means that the package manager will be npm, otherwise yarn
 * @property {'yarn add'|'npm i'} manager command that will be used to install packages
 * @property {String} mainFile main file of the project
 */
