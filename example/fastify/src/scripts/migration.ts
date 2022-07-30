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
    'npx sequelize db:migrate --to $(ls src/database/postgres/migrations | sort -r | head -n 1)'
  )

  console.log('Migration complete')
}

migration()
