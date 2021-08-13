const writeFile = require('../utils/writeFile')

/**
 * @param {String} projectName
 * @returns {Promise<void>}
 */
module.exports = async projectName => {
  const data = {
    herokuContent: `build:
  docker:
    web: Dockerfile`,
    herokuFile: 'heroku.yml'
  }

  await writeFile(`${projectName}/${data.herokuFile}`, data.herokuContent)
}
