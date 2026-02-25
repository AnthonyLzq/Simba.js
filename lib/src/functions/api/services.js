const { platform } = require('node:os')
const { promisify } = require('node:util')
const exec = promisify(require('node:child_process').exec)

const writeFile = require('../../utils/writeFile')
const { renderTemplate } = require('../../utils/renderTemplate')

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {import('../../utils/entity').EntityContext} args.entityContext
 */
module.exports = async ({ projectName, entityContext }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/services \
${projectName}/src/services/utils \
${projectName}/src/services/utils/messages`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  const t = (templatePath, data = {}) =>
    renderTemplate(`api/services/${templatePath}`, data)

  await Promise.all([
    writeFile(
      `${projectName}/src/services/index.ts`,
      t('index.ts.ejs', entityContext)
    ),
    writeFile(`${projectName}/src/services/BaseHttp.ts`, t('BaseHttp.ts.ejs')),
    writeFile(
      `${projectName}/src/services/${entityContext.Entity}.ts`,
      t('entity.ts.ejs', entityContext)
    ),
    writeFile(
      `${projectName}/src/services/utils/index.ts`,
      t('utils/index.ts.ejs')
    ),
    writeFile(
      `${projectName}/src/services/utils/messages/index.ts`,
      t('utils/messages/index.ts.ejs', entityContext)
    ),
    writeFile(
      `${projectName}/src/services/utils/messages/${entityContext.entity}.ts`,
      t('utils/messages/entity.ts.ejs', entityContext)
    )
  ])
}
