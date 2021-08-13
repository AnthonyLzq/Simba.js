const writeFile = require('../utils/writeFile')

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
  const data = {
    content: '',
    file   : 'package.json'
  }

  data.content = `{
  "name": "${projectName.toLowerCase().replace(/ /g, '-')}",
  "version": "${projectVersion}",
  "main": "${mainFile}",
  "description": "${projectDescription}",
  "scripts": {
    "build:dev": "webpack --mode development",
    "build": "webpack --mode production",
    "lint": "eslint src/* --ext .ts",
    "service": "nodemon",
    "start": "node dist/index.js",
    "release": "standard-version"
  },
  "author": "${author}",${
    license !== 'unlicense' ? `\n  "license": "${license.toUpperCase()}",\n` : ''
  }
  "dependencies": {},
  "devDependencies": {}
}
`
  await writeFile(`${projectName}/${data.file}`, data.content)
}

/**
 * @typedef {Object} PackageConfig params to create the package.json file
 * @property {String} author
 * @property {String} projectName
 * @property {String} projectDescription
 * @property {String} projectVersion
 * @property {'unlicense'|'mit'|'apache-2.0'|'mpl-2.0'|'lgpl-3.0'|'gpl-3.0'|'agpl-3.0'} license
 * @property {String} mainFle
 */
