const writeFile = require('../utils/writeFile')

/**
 * @param {String} projectName
 * @returns {Promise<void>}
 */
module.exports = async projectName => {
  const data = {
    nodemonContent: `{
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
`,
    nodemonFile: 'nodemon.json'
  }

  await writeFile(`${projectName}/${data.nodemonFile}`, data.nodemonContent)
}
