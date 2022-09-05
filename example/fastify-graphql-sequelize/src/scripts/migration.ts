import { dbConnection } from 'database'
import { promisify } from 'util'

const exec = promisify(require('child_process').exec)

const migration = async () => {
  const connection = await dbConnection()

  await connection.connect()

  console.log('Creating migration')

  if (process.env.MIGRATION)
    await connection.createMigration(process.env.MIGRATION)

  console.log('Executing migration')

  await exec(
    'yarn migrations:run:last && eslint src/database/* --ext .js --fix'
  )

  console.log('Migration complete')
}

migration()
