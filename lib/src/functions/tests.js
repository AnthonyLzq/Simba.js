const mkdirs = require('../utils/mkdirs')
const writeFile = require('../utils/writeFile')
const { renderTemplate } = require('../utils/renderTemplate')

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {Boolean} args.graphql
 * @param {Boolean} args.dbIsSQL
 * @param {import('../../utils/entity').EntityContext} args.entityContext
 * @returns {Promise<void>}
 */
module.exports = async ({ projectName, graphql, dbIsSQL, entityContext }) => {
  await mkdirs(`${projectName}/test`)

  await Promise.all([
    writeFile(
      `${projectName}/vitest.config.ts`,
      renderTemplate('config/vitest.config.ts.ejs', { graphql })
    ),
    writeFile(
      `${projectName}/test/index.test.ts`,
      renderTemplate('config/test/index.test.ts.ejs', {
        graphql,
        dbIsSQL,
        ...entityContext
      })
    )
  ])
}
