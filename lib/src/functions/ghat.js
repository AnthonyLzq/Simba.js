const { platform } = require('os')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const writeFile = require('../utils/writeFile')

/**
 * @param {String} projectName
 * @param {'yarn add'|'npm i'} manager
 * @returns {Promise<void>}
 */
module.exports = async (projectName, manager) => {
  const createFoldersCommand = `mkdir ${projectName}/.github \
${projectName}/.github/workflows`
  const managerName = manager.split()[0]

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  const data = {
    test: {
      content: `name: Tests - ${projectName}

on: [push]

jobs:
  test:
    name: Testing Simba.js API
    runs-on: ubuntu-latest

    steps:
      - name: Check out Git repository
        uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 16.x

      - name: Install Node.js dependencies
        run: ${
          managerName === 'yarn' ? 'yarn install --frozen-lockfile' : 'npm ci'
        }

      - name: Revert changes into the ${
        managerName === 'yarn' ? 'yarn.lock' : 'package-lock.json'
      } file
        run: git checkout -- ${
          managerName === 'yarn' ? 'yarn.lock' : 'package-lock.json'
        }

      - name: Run test
        run: ${managerName === 'yarn' ? 'yarn' : 'npm run'} test:ci
        env:
          MONGO_URI: \${{ secrets.MONGO_URI }}
          NODE_ENV: ci
`,
      file: `${projectName}/.github/workflows/test.yml`
    }
  }

  await writeFile(data.test.file, data.test.content)
}
