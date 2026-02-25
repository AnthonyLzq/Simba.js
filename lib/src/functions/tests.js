const { platform } = require('node:os')
const { promisify } = require('node:util')
const exec = promisify(require('node:child_process').exec)
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
  const createFoldersCommand = `mkdir ${projectName}/test`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

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
