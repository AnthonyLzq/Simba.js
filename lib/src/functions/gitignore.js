const writeFile = require('../utils/writeFile')
const { renderTemplate } = require('../utils/renderTemplate')

/**
 * @param {String} projectName
 * @returns {Promise<void>}
 */
module.exports = async projectName => {
  const content = renderTemplate('config/.gitignore.ejs')

  await writeFile(`${projectName}/.gitignore`, content)
}
