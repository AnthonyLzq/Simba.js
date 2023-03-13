const ENVIRONMENTS_WITH_DB_URI = ['ci', 'local']
const PACKAGE_MANAGERS = ['npm', 'yarn', 'pnpm']
const ONE_CHARACTER_REGEX = /^\w/
const UNLICENSED = 'unlicensed'
const LICENSES = {
  mit: 'MIT',
  apache: 'Apache 2.0',
  mpl: 'MPL 2.0',
  lgpl: 'LGPL 3.0',
  gpl: 'GPL 3.0',
  agpl: 'AGPL 3.0'
}
const DATABASES = {
  mongo: 'MongoDB',
  postgres: 'PostgreSQL',
  mysql: 'MySQL',
  mariadb: 'MariaDB',
  sqlite: 'Sqlite',
  sqlServer: 'Microsoft SQL Server'
}
const YEAR_REGEX = /^\d{4}$/
const EMAIL_REGEX =
  /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i
const PROJECT_VERSION = '0.1.0'
const MAIN_FILE = 'src/index.ts'

module.exports = {
  ENVIRONMENTS_WITH_DB_URI,
  PACKAGE_MANAGERS,
  ONE_CHARACTER_REGEX,
  UNLICENSED,
  LICENSES,
  DATABASES,
  YEAR_REGEX,
  EMAIL_REGEX,
  PROJECT_VERSION,
  MAIN_FILE
}
