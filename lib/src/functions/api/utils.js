const { platform } = require('node:os')
const { promisify } = require('node:util')
const exec = promisify(require('node:child_process').exec)
const writeFile = require('../../utils/writeFile')
const { renderTemplate } = require('../../utils/renderTemplate')

/**
 * @param {Object} args
 * @param {String} args.projectName
 */
module.exports = async ({ projectName }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/utils`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  const t = (templatePath, data = {}) =>
    renderTemplate(`api/utils/${templatePath}`, data)

  await Promise.all([
    writeFile(`${projectName}/src/utils/index.ts`, t('index.ts.ejs')),
    writeFile(`${projectName}/src/utils/Logger.ts`, t('Logger.ts.ejs'))
  ])
}
