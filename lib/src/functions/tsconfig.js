const writeFile = require('../utils/writeFile')
const { renderTemplate } = require('../utils/renderTemplate')

/**
 * @param {String} projectName
 * @returns {Promise<void>}
 */
module.exports = async projectName => {
  await writeFile(
    `${projectName}/tsconfig.base.json`,
    renderTemplate('config/tsconfig.base.json.ejs')
  )
  await writeFile(
    `${projectName}/tsconfig.json`,
    renderTemplate('config/tsconfig.json.ejs')
  )
}
