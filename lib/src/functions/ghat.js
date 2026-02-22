const { platform } = require('node:os')
const { promisify } = require('node:util')
const exec = promisify(require('node:child_process').exec)
const writeFile = require('../utils/writeFile')

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
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
${pnpmSetup}
      - name: Install Node.js dependencies
        run: ${installCmd}

      - name: Revert changes into the ${lockFile} file
        run: git checkout -- ${lockFile}

      - name: Run lint
        run: ${runCmd} lint

      - name: Check for changes
        id: verify-changed-files
        run: |
          if [ -n "$(git status --porcelain)" ]; then
            echo "changed=true" >> $GITHUB_OUTPUT
            echo "✅ Changes detected after linting, preparing to commit..."
          else
            echo "changed=false" >> $GITHUB_OUTPUT
            echo "ℹ️ No changes after linting, nothing to do, skipping commit"
          fi

      - name: Commit lint fixes
        if: steps.verify-changed-files.outputs.changed == 'true'
        uses: stefanzweifel/git-auto-commit-action@v6
        with:
          commit_message: 'feat: automated lint with biome'
          file_pattern: '.'`,
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
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
${pnpmSetup}
      - name: Install Node.js dependencies
        run: ${installCmd}

      - name: Run test
        run: ${runCmd} test:ci
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
