const writeFile = require('../utils/writeFile')
const { renderTemplate } = require('../utils/renderTemplate')

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {String} args.manager
 * @returns {Promise<void>}
 */
// TODO: add the correct package manager
module.exports = async ({ projectName, manager }) => {
  const managerName = manager.split(' ')[0]

  await Promise.all([
    writeFile(
      `${projectName}/Dockerfile`,
      renderTemplate('config/Dockerfile.ejs', { managerName })
    ),
    writeFile(
      `${projectName}/.dockerignore`,
      renderTemplate('config/.dockerignore.ejs')
    )
  ])
}
