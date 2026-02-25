const mkdirs = require('../../utils/mkdirs')
const writeFile = require('../../utils/writeFile')
const { renderTemplate } = require('../../utils/renderTemplate')

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {Boolean} args.dbIsSQL
 * @param {import('../../utils/entity').EntityContext} args.entityContext
 */
module.exports = async ({ projectName, dbIsSQL, entityContext }) => {
  await mkdirs(`${projectName}/src/schemas`)

  const t = (templatePath, data = {}) =>
    renderTemplate(`api/schemas/${templatePath}`, data)

  await Promise.all([
    writeFile(
      `${projectName}/src/schemas/index.ts`,
      t('index.ts.ejs', entityContext)
    ),
    writeFile(
      `${projectName}/src/schemas/${entityContext.entity}.ts`,
      t('entity.ts.ejs', entityContext)
    ),
    writeFile(`${projectName}/src/schemas/id.ts`, t('id.ts.ejs', { dbIsSQL }))
  ])
}
