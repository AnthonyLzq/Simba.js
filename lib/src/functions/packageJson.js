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
    file: 'package.json'
  }

  data.content = `{
  "name": "${projectName
    .toLowerCase()
    .replaceAll(' ', '-')
    .replaceAll('/', '-')}",
  "version": "${projectVersion}",
  "main": "${mainFile}",
  "description": "${projectDescription}",
  "scripts": {
    "build:dev": "webpack --mode development",
    "build": "webpack --mode production",
    "lint": "eslint src/* --ext .ts --fix",
    "service": "nodemon",
    "start": "node dist/index.js",
    "release": "standard-version",
    "test:ci": "jest --ci -i",
    "test:local": "NODE_ENV=local jest --ci -i"
  },
  "author": "${author}",${
    license !== 'unlicensed'
      ? `\n  "license": "${license.toUpperCase()}",\n`
      : ''
  }
  "dependencies": {},
  "devDependencies": {},
  "nodemonConfig": {
    "watch": [
      ".env",
      "src"
    ],
    "ext": "ts",
    "ignore": [
      "src/**/*.test.ts"
    ],
    "exec": "npx ts-node -r dotenv/config ./src/index"
  }
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
 * @property {'unlicensed'|'mit'|'apache-2.0'|'mpl-2.0'|'lgpl-3.0'|'gpl-3.0'|'agpl-3.0'} license
 * @property {String} mainFle
 */
