const writeFile = require('../utils/writeFile')

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {Boolean} args.dbIsSQL
 * @returns {Promise<void>}
 */
module.exports = async ({ projectName, dbIsSQL }) => {
  const data = {
    eslintContent: `{
  "env": {
    "node": true,
    "jest": true
  },
  "root": true,
  "parser": "@typescript-eslint/parser",
  "plugins": [
    "@typescript-eslint",
    "import",
    "prettier",
    "jest"
  ],
  "extends": [
    "standard",
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/no-empty-interface": "off",
    "arrow-parens": [
      "error",
      "as-needed"
    ],
    "import/extensions": [
      2,
      {
        "ts": "never",
        "js": "always",
        "json": "always"
      }
    ],
    "import/no-extraneous-dependencies": [
      "error",
      {
        "devDependencies": [
          "**/*.test.ts",
          "webpack.config.js",
          "jest.config.ts"${
            dbIsSQL ? ',\n          "src/database/postgres/config.js"' : ''
          }
        ],
        "optionalDependencies": [
          "**/*.test.ts"
        ],
        "peerDependencies": [
          "**/*.test.ts"
        ]
      }
    ],
    "max-len": [
      "error",
      {
        "code": 80,
        "ignoreComments": true,
        "ignoreRegExpLiterals": true,
        "ignoreTemplateLiterals": true,
        "ignoreTrailingComments": true,
        "ignoreStrings": true,
        "ignoreUrls": true
      }
    ],
    "newline-before-return": "error",
    "object-curly-spacing": [
      "error",
      "always"
    ],
    "object-shorthand": [
      "error",
      "always"
    ],
    "prefer-const": "error",
    "prettier/prettier": [
      "error",
      {
        "arrowParens": "avoid",
        "bracketSpacing": true,
        "printWidth": 80,
        "quoteProps": "as-needed",
        "semi": false,
        "singleQuote": true,
        "tabWidth": 2,
        "trailingComma": "none"
      }
    ],
    "radix": [
      "error",
      "as-needed"
    ],
    "spaced-comment": [
      "error",
      "always"
    ],
    "curly": [
      "error",
      "multi"
    ]
  }
}`,
    eslintFile: '.eslintrc',
    eslintIgnoreContent: '/dist',
    eslintIgnoreFile: '.eslintignore'
  }

  await Promise.all([
    writeFile(`${projectName}/${data.eslintFile}`, data.eslintContent),
    writeFile(
      `${projectName}/${data.eslintIgnoreFile}`,
      data.eslintIgnoreContent
    )
  ])
}
