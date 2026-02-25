const writeFile = require('../utils/writeFile')

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @returns {Promise<void>}
 */
module.exports = async ({ projectName }) => {
  const biomeConfig = {
    $schema: 'https://biomejs.dev/schemas/2.4.4/schema.json',
    vcs: {
      enabled: false,
      clientKind: 'git',
      useIgnoreFile: false
    },
    files: {
      ignoreUnknown: false
    },
    formatter: {
      enabled: true,
      useEditorconfig: true,
      formatWithErrors: false,
      indentStyle: 'space',
      indentWidth: 2,
      lineEnding: 'lf',
      lineWidth: 80,
      attributePosition: 'auto',
      bracketSpacing: true
    },
    linter: {
      enabled: true,
      rules: {
        recommended: true,
        correctness: {
          noUnusedVariables: 'error'
        },
        style: {
          useConst: 'error',
          useTemplate: 'error'
        },
        suspicious: {
          noDebugger: 'error',
          noDoubleEquals: 'error',
          noExplicitAny: 'off'
        }
      }
    },
    javascript: {
      parser: {
        unsafeParameterDecoratorsEnabled: true
      },
      formatter: {
        jsxQuoteStyle: 'double',
        quoteProperties: 'asNeeded',
        trailingCommas: 'none',
        semicolons: 'asNeeded',
        arrowParentheses: 'asNeeded',
        bracketSameLine: false,
        bracketSpacing: true,
        quoteStyle: 'single'
      },
      globals: [
        'console',
        'process',
        'Buffer',
        '__dirname',
        '__filename',
        'global',
        'module',
        'require',
        'exports'
      ]
    }
  }

  // En Biome 2.1.3, los decoradores de TypeScript se configuran diferente
  // Si necesitas decoradores para GraphQL, se pueden habilitar via tsconfig.json

  // Configuración específica para archivos de test
  // Vitest usa imports explícitos, pero mantenemos globals por compatibilidad
  biomeConfig.overrides = [
    {
      includes: [
        '**/*.test.ts',
        '**/*.test.js',
        '**/*.spec.ts',
        '**/*.spec.js'
      ],
      javascript: {
        globals: [
          'describe',
          'it',
          'test',
          'expect',
          'beforeAll',
          'afterAll',
          'beforeEach',
          'afterEach',
          'vi'
        ]
      }
    }
  ]

  const biomeConfigContent = JSON.stringify(biomeConfig, null, 2)

  const biomeignoreContent = `# Build outputs
dist/
build/

# Dependencies
node_modules/

# Test coverage
coverage/

# Environment files
.env*

# Logs
*.log

# Database
prisma/migrations/
`

  await Promise.all([
    writeFile(`${projectName}/biome.json`, biomeConfigContent),
    writeFile(`${projectName}/.biomeignore`, biomeignoreContent)
  ])
}
