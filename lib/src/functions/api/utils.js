const { platform } = require('node:os')
const { promisify } = require('node:util')
const exec = promisify(require('node:child_process').exec)
const writeFile = require('../../utils/writeFile')
const { renderTemplate } = require('../../utils/renderTemplate')

/**
 * @param {Object} args
 * @param {Boolean} args.fastify
 * @param {String} args.projectName
 * @param {String} args.email
 * @param {String} args.projectVersion
 * @param {String} args.graphQL
 */
module.exports = async ({
  fastify,
  projectName,
  email,
  projectVersion,
  graphQL
}) => {
  const createFoldersCommand = `mkdir ${projectName}/src/utils`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  const t = (templatePath, data = {}) =>
    renderTemplate(`api/utils/${templatePath}`, data)

  const processes = [
    writeFile(
      `${projectName}/src/utils/index.ts`,
      t('index.ts.ejs', { fastify })
    ),
    writeFile(`${projectName}/src/utils/Logger.ts`, t('Logger.ts.ejs'))
  ]

  if (!fastify)
    processes.push(
      writeFile(
        `${projectName}/src/utils/docs.json`,
        t('docs.json.ejs', { projectName, email, projectVersion, graphQL })
      )
    )

  await Promise.all(processes)
}
