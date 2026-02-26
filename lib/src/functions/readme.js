const writeFile = require('../utils/writeFile')
const titleCase = require('../utils/titleCase')
const { renderTemplate } = require('../utils/renderTemplate')

/**
 * @param {String} projectName
 * @param {String} projectDescription
 * @returns {Promise<void>}
 */
module.exports = async (projectName, projectDescription) => {
  const content = renderTemplate('config/README.md.ejs', {
    titleCaseName: titleCase(projectName),
    projectDescription
  })

  await writeFile(`${projectName}/README.md`, content)
}
