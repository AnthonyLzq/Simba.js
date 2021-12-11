const writeFile = require('../utils/writeFile')
const titleCase = require('../utils/titleCase')

/**
 * @param {String} projectName
 * @param {String} projectDescription
 * @returns {Promise<void>}
 */
module.exports = async (projectName, projectDescription) => {
  const data = {
    readmeContent: `# ${titleCase(projectName)}\n\n${projectDescription}.\n`,
    readmeFile: 'README.md'
  }

  await writeFile(`${projectName}/${data.readmeFile}`, data.readmeContent)
}
