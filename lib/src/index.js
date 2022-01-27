const cliProgress = require('cli-progress')
const colors = require('colors')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const packageJson = require('./functions/packageJson')
const readme = require('./functions/readme')
const changelog = require('./functions/changelog')
const licenseF = require('./functions/license')
const gitignore = require('./functions/gitignore')
const tsconfig = require('./functions/tsconfig')
const nodemon = require('./functions/nodemon')
const eslint = require('./functions/eslint')
const webpack = require('./functions/webpack')
const docker = require('./functions/docker')
const herokuF = require('./functions/heroku')
const express = require('./functions/api')

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
 * @param {Config} config configuration to build the project
 */
module.exports = async ({
  author,
  email,
  projectName,
  projectDescription,
  heroku,
  license,
  version,
  licenseYear,
  manager,
  mainFile
}) => {
  const process = 4
  let i = 0

  const options = setOptions(process)
  const bar = new cliProgress.SingleBar(
    options,
    cliProgress.Presets.shades_classic
  )

  const expressProdPackages = 'express joi morgan swagger-ui-express'
  const prodPackages = `${manager} http-errors mongoose ${expressProdPackages}`

  const expressDevPackages = `@types/express @types/morgan @types/swagger-ui-express`
  const devPackages = `${manager} -D \
@types/http-errors \
@types/node \
@typescript-eslint/eslint-plugin \
@typescript-eslint/parser \
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
tsconfig-paths-webpack-plugin \
typescript \
webpack \
webpack-cli \
webpack-node-externals \
${expressDevPackages}`

  bar.start(process, i)

  try {
    await exec(`mkdir ${projectName}`)
    bar.update(++i)

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
      nodemon(projectName),
      eslint(projectName),
      webpack(projectName),
      docker(projectName),
      express(projectName, version, email),
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

    if (heroku) functions.push(herokuF(projectName))

    await Promise.all(functions)
    bar.update(++i)

    await exec(prodPackages, { cwd: `./${projectName}` })
    bar.update(++i)

    await exec(devPackages, { cwd: `./${projectName}` })
    bar.update(++i)

    bar.stop()
  } catch (e) {
    console.error(e)
  }
}

/**
 * @typedef {Object} Config configuration to initialize a project
 * @property {String} author author of the project
 * @property {String} email email of the project author
 * @property {String} projectName project name
 * @property {String} projectDescription project description
 * @property {Boolean} heroku true if the project will be deployed in heroku
 * @property {'unlicensed'|'mit'|'apache-2.0'|'mpl-2.0'|'lgpl-3.0'|'gpl-3.0'|'agpl-3.0'} license project license
 * @property {String} version project initial version
 * @property {String} licenseYear year when the license starts in format YYYY
 * @property {Boolean} npm true means that the package manager will be npm, otherwise yarn
 * @property {'yarn add'|'npm i'} manager command that will be used to install packages
 * @property {String} mainFile main file of the project
 */

/**
 * @typedef {Object} CliOptions
 * @property {String} format cli format to show the progress to the user
 * @property {Boolean} hideCursor
 * @property {Boolean} synchronousUpdate
 */