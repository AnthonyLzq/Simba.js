const writeFile = require('../utils/writeFile')
const { renderTemplate } = require('../utils/renderTemplate')

/**
 * @param {PackageConfig} packageConfig
 * @returns {Promise<void>}
 */
module.exports = async ({
  author,
  projectName,
  projectDescription,
  projectVersion,
  license,
  mainFile
}) => {
  const sanitizedName = projectName
    .toLowerCase()
    .replaceAll(' ', '-')
    .replaceAll('/', '-')

  const content = renderTemplate('config/package.json.ejs', {
    sanitizedName,
    projectVersion,
    mainFile,
    projectDescription,
    author,
    license
  })

  await writeFile(`${projectName}/package.json`, content)
}

/**
 * @typedef {Object} PackageConfig params to create the package.json file
 * @property {String} author
 * @property {String} projectName
 * @property {String} projectDescription
 * @property {String} projectVersion
 * @property {'unlicensed'|'mit'|'apache-2.0'|'mpl-2.0'|'lgpl-3.0'|'gpl-3.0'|'agpl-3.0'} license
 * @property {String} mainFle
 */
