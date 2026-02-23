const { platform } = require('node:os')
const { promisify } = require('node:util')
const exec = promisify(require('node:child_process').exec)
const writeFile = require('../utils/writeFile')
const { renderTemplate } = require('../utils/renderTemplate')

/**
 * @param {String} projectName
 * @param {'yarn add'|'npm i'|'pnpm i'} manager
 * @returns {Promise<void>}
 */
module.exports = async (projectName, manager) => {
  const createFoldersCommand = `mkdir ${projectName}/.github \
${projectName}/.github/workflows`
  const managerName = manager.split(' ')[0]

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  const installCmd =
    managerName === 'yarn'
      ? 'yarn install --frozen-lockfile'
      : managerName === 'pnpm'
        ? 'pnpm i --frozen-lockfile'
        : 'npm ci'

  const lockFile =
    managerName === 'yarn'
      ? 'yarn.lock'
      : managerName === 'pnpm'
        ? 'pnpm-lock.yaml'
        : 'package-lock.json'

  const runCmd = managerName === 'yarn' ? 'yarn' : `${managerName} run`

  const pnpmSetup =
    managerName === 'pnpm'
      ? `
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9.x.x\n`
      : ''

  const data = { projectName, installCmd, lockFile, runCmd, pnpmSetup }

  await Promise.all([
    writeFile(
      `${projectName}/.github/workflows/lint.yml`,
      renderTemplate('config/ghat/lint.yml.ejs', data)
    ),
    writeFile(
      `${projectName}/.github/workflows/test.yml`,
      renderTemplate('config/ghat/test.yml.ejs', data)
    )
  ])
}
