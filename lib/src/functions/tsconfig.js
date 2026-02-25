const writeFile = require('../utils/writeFile')
const { renderTemplate } = require('../utils/renderTemplate')

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {Boolean} args.graphQL
 * @returns {Promise<void>}
 */
module.exports = async ({ projectName, graphQL = false }) => {
  await writeFile(
    `${projectName}/tsconfig.base.json`,
    renderTemplate('config/tsconfig.base.json.ejs', { graphQL })
  )
  await writeFile(
    `${projectName}/tsconfig.json`,
    renderTemplate('config/tsconfig.json.ejs')
  )
}
