const writeFile = require('../utils/writeFile')
const titleCase = require('../utils/titleCase')

/**
 * @param {String} projectName 
 * @returns {Promise<void>}
 */
module.exports = async projectName => {
  const data = {
    changelogContent: `# ${titleCase(projectName)}`,
    changelogFile   : 'CHANGELOG.md'
  }

  await writeFile(`${projectName}/${data.changelogFile}`, data.changelogContent)
}
