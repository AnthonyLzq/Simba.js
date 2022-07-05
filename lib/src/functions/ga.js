const { platform } = require('os')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const writeFile = require('../utils/writeFile')

/**
 * @param {String} projectName
 * @returns {Promise<void>}
 */
module.exports = async projectName => {
  const createFoldersCommand = `mkdir ${projectName}/.github \
${projectName}/.github/workflows`

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
        run: yarn

      - name: Revert changes into the yarn.lock file
        run: git checkout -- yarn.lock

      - name: Run test
        run: yarn test:ci
        env:
          MONGO_URI: \${{ secrets.MONGO_URI }}
          NODE_ENV: ci
`,
      file: `${projectName}/.github/workflows/test.yml`
    }
  }

  await writeFile(data.test.file, data.test.content)
}
