const { platform } = require('node:os')
const { promisify } = require('node:util')
const exec = promisify(require('node:child_process').exec)
const writeFile = require('../../utils/writeFile')
const { renderTemplate } = require('../../utils/renderTemplate')

const dbPrismaName = {
  postgres: 'postgresql',
  mysql: 'mysql',
  mariadb: 'mysql',
  sqlite: 'sqlite',
  sqlServer: 'sqlserver',
  mongo: 'mongodb'
}

const dbPrettyName = {
  postgres: 'PostgreSQL',
  mysql: 'MySQL',
  mariadb: 'MariaDB',
  sqlite: 'SQLite',
  sqlServer: 'SQL Server',
  mongo: 'MongoDB'
}

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {import('../../../../').Config['database']} args.db
 * @param {import('../../utils/entity').EntityContext} args.entityContext
 */
const db = async ({ projectName, db, entityContext }) => {
  const isMongo = db === 'mongo'
  const createFoldersCommands = `mkdir ${projectName}/prisma \
${projectName}/src/database/${db} \
${projectName}/src/database/${db}/queries`

  if (platform() === 'win32')
    await exec(createFoldersCommands.replaceAll('/', '\\'))
  else await exec(createFoldersCommands)

  const t = (templatePath, data = {}) =>
    renderTemplate(`api/database/${templatePath}`, data)

  await Promise.all([
    writeFile(
      `${projectName}/prisma/schema.prisma`,
      t('schema.prisma.ejs', {
        dbPrismaName: dbPrismaName[db],
        db,
        isMongo,
        ...entityContext
      })
    ),
    writeFile(
      `${projectName}/src/database/index.ts`,
      t('index.ts.ejs', { db })
    ),
    writeFile(
      `${projectName}/src/database/${db}/index.ts`,
      t('db-index.ts.ejs')
    ),
    writeFile(
      `${projectName}/src/database/${db}/connection.ts`,
      t('connection.ts.ejs', { dbPrettyName: dbPrettyName[db] })
    ),
    writeFile(
      `${projectName}/src/database/${db}/queries/index.ts`,
      t('queries-index.ts.ejs', entityContext)
    ),
    writeFile(
      `${projectName}/src/database/${db}/queries/${entityContext.entity}.ts`,
      t('queries-entity.ts.ejs', entityContext)
    )
  ])
}

/**
 * @param {Object} args
 * @param {import('../../../../').Config['database']} args.database
 * @param {String} args.projectName
 */
module.exports = async ({ database, projectName, entityContext }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/database`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  await db({ db: database, projectName, entityContext })
}
