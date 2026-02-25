const mkdirs = require('../../utils/mkdirs')
const writeFile = require('../../utils/writeFile')
const { renderTemplate } = require('../../utils/renderTemplate')

/**
 * @param {Object} args
 * @param {String} args.projectName
 */
module.exports = async ({ projectName }) => {
  await mkdirs(`${projectName}/src/utils`)

  const t = (templatePath, data = {}) =>
    renderTemplate(`api/utils/${templatePath}`, data)

  await Promise.all([
    writeFile(`${projectName}/src/utils/index.ts`, t('index.ts.ejs')),
    writeFile(`${projectName}/src/utils/Logger.ts`, t('Logger.ts.ejs'))
  ])
}
