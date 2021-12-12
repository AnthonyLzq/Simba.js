const writeFile = require('../utils/writeFile')

/**
 * @param {String} projectName
 * @returns {Promise<void>}
 */
module.exports = async projectName => {
  const data = {
    dockerContent: `FROM node:16-alpine

WORKDIR /app

COPY package.json ./

RUN yarn install --prod

COPY dist /app/dist

CMD [ "yarn", "start" ]
`,
    dockerFile: 'Dockerfile'
  }

  await writeFile(`${projectName}/${data.dockerFile}`, data.dockerContent)
}
