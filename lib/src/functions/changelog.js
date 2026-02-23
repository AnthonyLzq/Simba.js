const writeFile = require('../utils/writeFile')
const titleCase = require('../utils/titleCase')
const { renderTemplate } = require('../utils/renderTemplate')

/**
 * @param {String} projectName
 * @returns {Promise<void>}
 */
module.exports = async projectName => {
  const content = renderTemplate('config/CHANGELOG.md.ejs', {
    titleCaseName: titleCase(projectName)
  })

  await writeFile(`${projectName}/CHANGELOG.md`, content)
}
