const { platform } = require('os')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const writeFile = require('../utils/writeFile')

/**
 * @param {String} projectName
 * @param {'yarn add'|'npm i'|'pnpm i'} manager
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
    linting: {
      content: `name: Lint - ${projectName}

on: [push]

jobs:
  run-linters:
    name: Run linters
    runs-on: ubuntu-latest

    steps:
      - name: Check out Git repository
        uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18.x
${
  managerName === 'pnpm'
    ? `
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 6.x.x\n`
    : ''
}
      - name: Install Node.js dependencies
        run: ${
          managerName === 'yarn'
            ? 'yarn install --frozen-lockfile'
            : managerName
            ? 'pnpm i --frozen-lockfile'
            : 'npm ci'
        }

      - name: Run linters
        uses: wearerequired/lint-action@v2
        with:
          auto_fix: true
          eslint: true
          eslint_extensions: js\n`,
      file: `${projectName}/.github/workflows/lint.yml`
    },
    test: {
      content: `name: Tests - ${projectName}

on: [push]

jobs:
  test:
    environment: Test
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
          node-version: 18.x
${
  managerName === 'pnpm'
    ? `
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 6.x.x\n`
    : ''
}
      - name: Install Node.js dependencies
        run: ${
          managerName === 'yarn'
            ? 'yarn install --frozen-lockfile'
            : managerName
            ? 'pnpm i --frozen-lockfile'
            : 'npm ci'
        }

      - name: Run test
        run: ${managerName === 'npm' ? 'npm' : managerName} test:ci
        env:
          DATABASE_URL: \${{ secrets.DATABASE_URL }}
          NODE_ENV: ci
`,
      file: `${projectName}/.github/workflows/test.yml`
    }
  }

  await Promise.all([
    writeFile(data.linting.file, data.linting.content),
    writeFile(data.test.file, data.test.content)
  ])
}
