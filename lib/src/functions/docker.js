const writeFile = require('../utils/writeFile')

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {String} args.manager
 * @returns {Promise<void>}
 */
// TODO: add the correct package manager
module.exports = async ({ projectName, manager }) => {
  const managerName = manager.split(' ')[0]

  const data = {
    dockerContent: `FROM node:18-alpine
${managerName === 'pnpm' ? '\nRUN corepack enable\n' : ''}
WORKDIR /app

COPY . ./

RUN ${
      managerName === 'yarn' ? 'yarn' : managerName === 'npm' ? 'npm' : 'pnpm'
    } i

CMD [ "${managerName}", "start" ]`,
    dockerFile: 'Dockerfile',
    dockerIgnoreContent: `.eslintignore
.eslintrc

.git
.gitignore
.github

*.md
LICENSE

*.http
nodemon.json

jest.config.ts
*.log

test

# optionally you may want to ignore the .env file, but that depends on your own implementation
.env`,
    dockerIgnoreFile: '.dockerignore'
  }

  await Promise.all([
    writeFile(`${projectName}/${data.dockerFile}`, data.dockerContent),
    writeFile(
      `${projectName}/${data.dockerIgnoreFile}`,
      data.dockerIgnoreContent
    )
  ])
}
