const { platform } = require('node:os')
const { promisify } = require('node:util')
const exec = promisify(require('node:child_process').exec)
const writeFile = require('../../utils/writeFile')
const { renderTemplate } = require('../../utils/renderTemplate')

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {Boolean} args.dbIsSQL
 */
module.exports = async ({ projectName, dbIsSQL }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/schemas`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  const t = (templatePath, data = {}) =>
    renderTemplate(`api/schemas/${templatePath}`, data)

  await Promise.all([
    writeFile(`${projectName}/src/schemas/index.ts`, t('index.ts.ejs')),
    writeFile(`${projectName}/src/schemas/user.ts`, t('user.ts.ejs')),
    writeFile(`${projectName}/src/schemas/id.ts`, t('id.ts.ejs', { dbIsSQL }))
  ])
}
