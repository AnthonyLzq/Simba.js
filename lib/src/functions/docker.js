const writeFile = require('../utils/writeFile')

/**
 * @param {String} projectName
 * @returns {Promise<void>}
 */
// TODO: add the correct package manager
module.exports = async projectName => {
  const data = {
    dockerContent: `FROM node:16-alpine

WORKDIR /app

COPY . ./

RUN yarn install --prod

RUN yarn add webpack webpack-node-externals tsconfig-paths-webpack-plugin -D

RUN yarn build

RUN yarn remove webpack webpack-node-externals tsconfig-paths-webpack-plugin

CMD [ "yarn", "start" ]
`,
    dockerFile: 'Dockerfile',
    dockerIgnoreContent: `.eslintignore
.eslintrc
.gitignore
CHANGELOG.md
Dockerfile
heroku.yml
*.http
LICENSE
nodemon.json
README.md

# optionally you may want to ignore the .env file, but that depends on your own implementation
.env`,
    dockerIgnoreFile: '.dockerignore'
  }

  await writeFile(`${projectName}/${data.dockerFile}`, data.dockerContent)
  await writeFile(
    `${projectName}/${data.dockerIgnoreFile}`,
    data.dockerIgnoreContent
  )
}
